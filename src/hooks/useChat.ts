import { useEffect, useState, useRef, useCallback } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { generateKeyPair, importPublicKey, importPrivateKey, deriveSecretKey, encryptMessage, decryptMessage } from '@/lib/e2ee';
import { ChatService } from '@/services/chatService';

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'sticker' | 'emoji' | 'system';
  metadata: any;
  created_at: string;
  reactions: any[];
};

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const { profile: myProfile, playNotificationSound } = useProfile();
  const secretKeyRef = useRef<CryptoKey | null>(null);
  const typingTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // 1. E2EE Secret Derivation
  const initE2E = useCallback(async (partnerPublicKey: any) => {
    if (!myProfile || !partnerPublicKey) return;
    try {
      let myKeyPairJwkStr = localStorage.getItem(`e2e_${myProfile.id}`);
      let myPrivateKey: CryptoKey;
      if (!myKeyPairJwkStr) {
        const generated = await generateKeyPair();
        localStorage.setItem(`e2e_${myProfile.id}`, JSON.stringify({ public: generated.publicKeyJwk, private: generated.privateKeyJwk }));
        myPrivateKey = await importPrivateKey(generated.privateKeyJwk);
      } else {
        const keys = JSON.parse(myKeyPairJwkStr);
        myPrivateKey = await importPrivateKey(keys.private);
      }
      const partnerPubKey = await importPublicKey(partnerPublicKey);
      secretKeyRef.current = await deriveSecretKey(myPrivateKey, partnerPubKey);
    } catch (err) {
      console.error('useChat E2E init error:', err);
    }
  }, [myProfile]);

  const tryDecrypt = useCallback(async (contentStr: string) => {
    if (!contentStr) return '';
    try {
      if (contentStr.startsWith('{') && contentStr.endsWith('}')) {
        const parsed = JSON.parse(contentStr);
        if (parsed.iv && parsed.cipherText) {
          if (!secretKeyRef.current) return '🔒 [Key missing]';
          return await decryptMessage(parsed, secretKeyRef.current);
        }
      }
    } catch (e) { }
    return contentStr;
  }, []);

  // 2. Fetch Messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await ChatService.fetchMessages(conversationId);
      const decrypted = await Promise.all(
        data.messages.map(async (m: any) => ({
          ...m,
          content: await tryDecrypt(m.content)
        }))
      );
      setMessages(decrypted);
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, tryDecrypt]);

  // 3. Real-time Subscription
  useEffect(() => {
    if (!conversationId) return;
    fetchMessages();

    const unsubscribe = ChatService.subscribeToConversation(
      conversationId,
      async (payload) => {
        const newMessage = { ...(payload.new as any) };

        // Decrypt BEFORE pushing to state so React renders the plaintext, not the JSON wrapper
        newMessage.content = await tryDecrypt(newMessage.content);
        newMessage.reactions = [];

        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        if (newMessage.sender_id !== myProfile?.id) {
          playNotificationSound();
        }
      },
      () => {
        fetchMessages();
      },
      (payload) => {
        const { userId, typing } = payload;
        setIsTyping(prev => ({ ...prev, [userId]: typing }));

        if (typing) {
          if (typingTimers.current[userId]) clearTimeout(typingTimers.current[userId]);
          typingTimers.current[userId] = setTimeout(() => {
            setIsTyping(prev => ({ ...prev, [userId]: false }));
          }, 3000);
        }
      }
    );

    return () => unsubscribe();
  }, [conversationId, fetchMessages, tryDecrypt, myProfile?.id, playNotificationSound]);

  // 4. Actions
  const sendMessage = useCallback(async (content: string, type: 'text' | 'sticker' | 'emoji' = 'text', metadata: any = {}) => {
    if (!conversationId || !content.trim()) return;

    let displayContent = content;
    let payload = content;

    if (secretKeyRef.current && type === 'text') {
      const encrypted = await encryptMessage(content, secretKeyRef.current);
      payload = JSON.stringify(encrypted);
    }

    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      conversation_id: conversationId,
      sender_id: myProfile?.id || '',
      content: displayContent,
      message_type: type,
      metadata,
      created_at: new Date().toISOString(),
      reactions: []
    } as ChatMessage]);

    try {
      const data = await ChatService.sendMessage(conversationId, payload, type, metadata);
      setMessages(prev => {
        // If real-time event already added the real message, just remove the optimistic temp message
        if (prev.some(m => m.id === data.message.id)) {
          return prev.filter(m => m.id !== tempId);
        }
        // Otherwise, substitute tempId for the real message
        return prev.map(m => m.id === tempId ? { ...data.message, content: displayContent, reactions: [] } : m);
      });
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      throw err;
    }
  }, [conversationId, myProfile]);

  const toggleReaction = useCallback(async (messageId: string, reaction: string) => {
    try {
      await ChatService.toggleReaction(messageId, reaction);
    } catch (err) {
      console.error('Toggle reaction error:', err);
    }
  }, []);

  const setTyping = useCallback((typing: boolean) => {
    if (!conversationId || !myProfile) return;
    ChatService.sendTypingBroadcast(conversationId, myProfile.id, typing);
  }, [conversationId, myProfile]);

  const markAsSeen = useCallback(async () => {
    if (!conversationId) return;
    try {
      await ChatService.markAsSeen(conversationId);
    } catch (e) { }
  }, [conversationId]);

  return { messages, loading, isTyping, sendMessage, toggleReaction, setTyping, markAsSeen, initE2E };
}
