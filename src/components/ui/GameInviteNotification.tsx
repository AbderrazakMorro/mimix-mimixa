'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, X, Check } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import GlassCard from './GlassCard';
import RomanticButton from './RomanticButton';

export default function GameInviteNotification() {
  const { pendingGameInvite, acceptGameInvite, declineGameInvite } = useProfile();

  if (!pendingGameInvite) return null;

  const senderName = pendingGameInvite.sender?.display_name || 'Your partner';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
      >
        <GlassCard className="p-4 border border-romantic-pink/30 shadow-2xl bg-white/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-romantic-pink/10 flex items-center justify-center flex-shrink-0">
              {pendingGameInvite.sender?.avatar_url ? (
                <img src={pendingGameInvite.sender.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <Gamepad2 className="text-romantic-pink" size={20} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 truncate">{senderName} invited you!</h4>
              <p className="text-xs text-gray-500">To play Mimix & Mimixa</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => declineGameInvite(pendingGameInvite.id)}
              className="flex-1 py-2 px-3 rounded-xl bg-gray-100/50 text-gray-600 border border-gray-200 text-xs font-bold hover:bg-gray-200/50 transition-colors flex items-center justify-center gap-1"
            >
              <X size={14} /> Decline
            </button>
            <button
              onClick={() => acceptGameInvite(pendingGameInvite.id)}
              className="flex-1 py-2 px-3 rounded-xl bg-romantic-pink text-white text-xs font-bold shadow-md shadow-romantic-pink/20 hover:bg-romantic-pink/90 transition-colors flex items-center justify-center gap-1"
            >
              <Check size={14} /> Accept
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
