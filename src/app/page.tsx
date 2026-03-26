'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import { Heart, Users, Sparkles, MessageSquare } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';

export default function Home() {
  const router = useRouter();
  const { relationship, sendGameInvite } = useProfile() || {};

  const startChatWithPartner = async () => {
    if (!relationship?.otherPerson?.id) return;
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'private', partner_id: relationship.otherPerson.id })
      });
      if (res.ok) {
        const { conversation } = await res.json();
        router.push(`/chat?id=${conversation.id}`);
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background">
      <AnimatedBackground motif="hearts" intensity="medium" />
      
      <GlassCard strong className="max-w-md w-full text-center relative z-10">
        <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
           className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white/50 overflow-hidden glow-pink"
        >
          <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
        </motion.div>

        <h1 className="font-serif text-heading-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-romantic-pink to-romantic-lavender mb-3 drop-shadow-sm leading-tight">
          Mimix & Mimixa
        </h1>
        <p className="text-gray-800 mb-8 sm:mb-10 font-bold text-body-lg px-4">
          Discover a deeper connection.
        </p>

        <div className="space-y-4 sm:space-y-5">
          <Link href="/create-room" className="block outline-none">
            <RomanticButton variant="primary" fullWidth className="py-4 sm:py-5 text-lg">
              <Heart size={22} fill="currentColor" />
              <span>Start Romantic Game</span>
            </RomanticButton>
          </Link>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-600 text-sm font-bold uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          <Link href="/join-room" className="block outline-none">
            <RomanticButton variant="secondary" fullWidth>
              <Users size={22} />
              <span>Join with Code</span>
            </RomanticButton>
          </Link>

          {relationship?.otherPerson && (
            <div className="pt-6 mt-2 border-t border-gray-100 grid grid-cols-2 gap-3">
              <button
                onClick={() => sendGameInvite?.(relationship.otherPerson.id)}
                className="py-4 rounded-2xl bg-romantic-pink/10 text-romantic-pink border-2 border-romantic-pink/20 font-black text-[10px] uppercase tracking-widest hover:bg-romantic-pink/20 transition-all flex items-center justify-center gap-2 group shadow-sm"
              >
                <Sparkles size={16} fill="currentColor" className="group-hover:rotate-12 transition-transform" />
                Play with {relationship.otherPerson.display_name?.split(' ')[0]}
              </button>
              
              <button
                onClick={startChatWithPartner}
                className="py-4 rounded-2xl bg-romantic-lavender/10 text-romantic-lavender border-2 border-romantic-lavender/20 font-black text-[10px] uppercase tracking-widest hover:bg-romantic-lavender/20 transition-all flex items-center justify-center gap-2 group shadow-sm"
              >
                <MessageSquare size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                Whisper
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </main>
  );
}
