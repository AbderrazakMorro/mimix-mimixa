'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart } from 'lucide-react';
import ChatUI from '@/components/ChatUI';
import { usePresence } from '@/hooks/usePresence';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchUserAndPartner() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const { user } = await res.json();
          if (!mounted) return;
          setUser(user);

          // Fetch active relationship explicitly here or using me relationships
          const relRes = await fetch('/api/relationships/me');
          if (relRes.ok) {
            const { relationships } = await relRes.json();
            const active = relationships.find((r: any) => r.status === 'accepted');
            if (active && mounted) {
              setPartner(active.otherPerson);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchUserAndPartner();

    return () => { mounted = false; };
  }, []);

  const { onlineStatus } = usePresence(partner?.id, user?.id);

  if (!user || !partner) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 shadow-2xl rounded-2xl overflow-hidden"
          >
            <ChatUI 
              currentUserId={user.id} 
              partnerId={partner.id} 
              partnerName={partner.username}
              partnerPublicKey={partner.public_key} 
              onClose={() => setIsOpen(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-romantic-pink to-romantic-rose rounded-full text-white shadow-lg flex items-center justify-center relative glow-pink cursor-pointer border-2 border-white"
      >
        <MessageCircle size={24} fill={isOpen ? "currentColor" : "none"} />
        
        {/* Presence Indicator */}
        <div 
          className={`absolute top-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${
            onlineStatus === 'online' ? 'bg-green-400' : 'bg-gray-400'
          }`}
          title={onlineStatus === 'online' ? 'Online' : 'Offline'}
        />
      </motion.button>
    </div>
  );
}
