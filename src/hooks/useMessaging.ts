import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateKeyPair, importPublicKey, importPrivateKey, deriveSecretKey, encryptMessage, decryptMessage } from '@/lib/e2ee';

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export function useMessaging(currentUserId: string | undefined, partnerId: string | undefined, partnerPublicKeyJwk: any) {
  const [messages, setMessages] = useState<Message[]>([]);
  const supabase = createClient();
  const secretKeyRef = useRef<CryptoKey | null>(null);

  const partnerPublicKeyString = JSON.stringify(partnerPublicKeyJwk);

  useEffect(() => {
    if (!currentUserId || !partnerId) return;

    const initE2EE = async () => {
      console.log('Initializing E2EE for:', currentUserId, 'Partner:', partnerId);
      let myKeyPairJwkStr = localStorage.getItem(`e2e_${currentUserId}`);
      let myPrivateKey: CryptoKey;
      let myPublicKeyJwk: any;
      
      try {
        if (!myKeyPairJwkStr) {
          console.log('Generating new E2EE key pair...');
          const generated = await generateKeyPair();
          myPublicKeyJwk = generated.publicKeyJwk;
          localStorage.setItem(`e2e_${currentUserId}`, JSON.stringify({ public: generated.publicKeyJwk, private: generated.privateKeyJwk }));
          myPrivateKey = await importPrivateKey(generated.privateKeyJwk);
        } else {
          const keys = JSON.parse(myKeyPairJwkStr);
          myPrivateKey = await importPrivateKey(keys.private);
          myPublicKeyJwk = keys.public;
        }

        // Always check if we need to upload/re-sync public key to DB
        // (Prevents "Key missing" if DB was reset but localStorage persists, 
        // also fixes mismatches when localStorage is cleared but DB isn't)
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
           const { user: me } = await meRes.json();
           const dbKeyStr = JSON.stringify(me.public_key || null);
           const localKeyStr = JSON.stringify(myPublicKeyJwk || null);
           
           if (dbKeyStr !== localKeyStr && myPublicKeyJwk) {
             console.log('Re-syncing public key to server (missing or mismatch)...');
             await fetch('/api/profile/public-key', { 
               method: 'POST', 
               body: JSON.stringify({ publicKey: myPublicKeyJwk }), 
               headers: { 'Content-Type': 'application/json'} 
             });
           }
        }

        let finalPartnerKey = partnerPublicKeyJwk;
        
        // Always try to fetch freshest partner key if prop is missing
        if (!finalPartnerKey && currentUserId && partnerId) {
           console.log('Partner public key missing in props, fetching from server...');
           try {
             const relRes = await fetch('/api/relationships/me');
             if (relRes.ok) {
               const data = await relRes.json();
               const active = data.relationships?.find((r:any) => r.status === 'accepted' && r.otherPerson?.id === partnerId);
               if (active && active.otherPerson?.public_key) {
                 finalPartnerKey = active.otherPerson.public_key;
                 console.log('Successfully fetched missing partner key from server!');
               }
             }
           } catch(e) {
             console.error('Failed to fetch partner key from server:', e);
           }
        }

        if (finalPartnerKey) {
          console.log('Partner public key found, deriving shared secret...');
          const partnerPubKey = await importPublicKey(finalPartnerKey);
          secretKeyRef.current = await deriveSecretKey(myPrivateKey, partnerPubKey);
        } else {
          console.warn('Partner public key missing, messages will be unreadable/plaintext.');
          secretKeyRef.current = null;
        }
      } catch (err) {
        console.error('E2EE initialization error:', err);
      }
      
      fetchMessages();
    };

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        const decryptedMsgs = await Promise.all(
          (data as Message[]).map(async (msg) => {
             return { ...msg, content: await tryDecrypt(msg.content) };
          })
        );
        setMessages(decryptedMsgs);
      }
    };

    const tryDecrypt = async (contentStr: string) => {
      if (!contentStr) return '';
      try {
        if (contentStr.startsWith('{') && contentStr.endsWith('}')) {
          const parsed = JSON.parse(contentStr);
          if (parsed.iv && parsed.cipherText) {
            if (!secretKeyRef.current) return '🔒 [Key missing - refresh page]';
            try {
              return await decryptMessage(parsed, secretKeyRef.current);
            } catch (err) {
              console.error('Decryption failed, returning plain JSON', err);
              return '🔒 [Decryption failed - Wrong key?]';
            }
          }
        }
      } catch(e) { /* Not JSON */ }
      return contentStr;
    };

    initE2EE();

    const channel = supabase
      .channel(`chat:${currentUserId}:${partnerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMessage = payload.new as Message;
          if (
            (newMessage.sender_id === currentUserId && newMessage.receiver_id === partnerId) ||
            (newMessage.sender_id === partnerId && newMessage.receiver_id === currentUserId)
          ) {
            newMessage.content = await tryDecrypt(newMessage.content);
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, partnerId, partnerPublicKeyString, supabase]);

  const sendMessage = async (content: string) => {
    if (!currentUserId || !partnerId || !content.trim()) return;

    let payload = content;
    if (secretKeyRef.current) {
       const encryptedObj = await encryptMessage(content, secretKeyRef.current);
       payload = JSON.stringify(encryptedObj);
    }

    // Optimistically create a temporary message to render it instantly
    const tempId = 'temp-' + Date.now();
    const tempMsg: Message = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: partnerId,
      content: content,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);

    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: partnerId, content: payload })
    });
    
    if (!res.ok) {
      console.error('Error sending message:', await res.json());
      setMessages(prev => prev.filter(m => m.id !== tempId)); // remove if failed
    } else {
      const data = await res.json();
      const realMsg = { ...data.message, content };
      // Replace temp message with real one from DB, BUT only if it wasn't already added by the websocket
      setMessages(prev => {
        if (prev.some(m => m.id === realMsg.id)) {
           return prev.filter(m => m.id !== tempId);
        }
        return prev.map(m => m.id === tempId ? realMsg : m);
      });
    }
  };

  return { messages, sendMessage };
}
