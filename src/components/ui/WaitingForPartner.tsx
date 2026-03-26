'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Heart } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import GlassCard from './GlassCard';

export default function WaitingForPartner() {
  const { activeSentInvite, cancelSentInvite, relationship } = useProfile();

  if (!activeSentInvite) return null;

  const partnerName = relationship?.otherPerson?.display_name || 'your partner';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-full max-w-sm"
        >
          <GlassCard className="p-8 text-center border border-romantic-pink/20 shadow-2xl bg-white/95">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-romantic-pink to-romantic-rose text-white rounded-full flex items-center justify-center mb-6 shadow-lg"
            >
              <Heart fill="currentColor" size={28} />
            </motion.div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">Invitation Sent!</h3>
            <p className="text-sm text-gray-500 mb-6">
              Waiting for <span className="font-semibold text-romantic-pink">{partnerName}</span> to accept your game invite...
            </p>

            <div className="flex items-center justify-center gap-2 text-romantic-pink mb-8">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Pending</span>
            </div>

            <button
              onClick={cancelSentInvite}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 border border-gray-200 text-sm font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} /> Cancel Invitation
            </button>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
