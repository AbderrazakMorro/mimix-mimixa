'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, X, Check, Sparkles, Volume2 } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function GameInviteNotification() {
  const { pendingGameInvite, acceptGameInvite, declineGameInvite } = useProfile();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef<string | null>(null);

  // Play sound when a new invite arrives
  useEffect(() => {
    if (pendingGameInvite && pendingGameInvite.id !== hasPlayedRef.current) {
      hasPlayedRef.current = pendingGameInvite.id;
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(NOTIFICATION_SOUND);
          audioRef.current.volume = 0.6;
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } catch {}

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Game Challenge! 🎮', {
          body: `${pendingGameInvite.sender?.display_name || 'Your partner'} wants to play Mimix & Mimixa`,
          icon: pendingGameInvite.sender?.avatar_url || '/assets/logo.png',
        });
      } else if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [pendingGameInvite]);

  if (!pendingGameInvite) return null;

  const senderName = pendingGameInvite.sender?.display_name || 'Your partner';

  return (
    <AnimatePresence>
      {/* Backdrop overlay */}
      <motion.div
        key="invite-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99] bg-black/30 backdrop-blur-sm"
        onClick={() => declineGameInvite(pendingGameInvite.id)}
      />

      {/* Notification card */}
      <motion.div
        key="invite-card"
        initial={{ opacity: 0, y: -60, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.9 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm"
      >
        <div className="relative bg-white rounded-[1.5rem] shadow-2xl border border-pink-100 overflow-hidden">
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-romantic-pink via-romantic-rose to-romantic-lavender" />
          
          {/* Decorative pulse */}
          <div className="absolute inset-0 bg-gradient-to-br from-romantic-pink/3 to-romantic-lavender/3 animate-pulse pointer-events-none" />

          <div className="relative z-10 p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-pink-100 overflow-hidden shadow-md">
                  {pendingGameInvite.sender?.avatar_url ? (
                    <img src={pendingGameInvite.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-romantic-pink to-romantic-rose">
                      <Gamepad2 className="text-white" size={24} />
                    </div>
                  )}
                </div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -bottom-1 -right-1 bg-romantic-pink text-white p-1.5 rounded-full shadow-lg border-2 border-white"
                >
                  <Sparkles size={10} />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-romantic-pink mb-1 flex items-center gap-1.5">
                  <Volume2 size={12} /> Game Challenge!
                </p>
                <h4 className="text-base font-bold text-gray-900 truncate">
                  {senderName} wants to play
                </h4>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Mimix & Mimixa</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => declineGameInvite(pendingGameInvite.id)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-50 text-gray-600 border border-gray-200 text-sm font-bold hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <X size={16} /> Decline
              </button>
              <button
                onClick={() => acceptGameInvite(pendingGameInvite.id)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-romantic-pink to-romantic-rose text-white text-sm font-bold shadow-lg shadow-romantic-pink/25 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Check size={16} /> Accept
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
