'use client';

import { useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, Copy, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import ProfileCard from '@/components/ui/ProfileCard';

export default function RoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { roomCode } = use(params);
  
  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';

  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players' }, payload => {
        console.log('Player joined/left!', payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, supabase]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}${queryStr}`);
    alert("Invite link copied!");
  };

  const startGame = () => {
    router.push(`/game/${roomCode}${queryStr}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
      <AnimatedBackground motif="hearts" intensity="low" />
      
      <GlassCard strong className="max-w-lg w-full text-center relative z-10">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="mx-auto w-16 h-16 bg-gradient-to-br from-romantic-pink to-romantic-rose text-white rounded-full flex items-center justify-center mb-6 glow-pink"
        >
          <Heart fill="currentColor" size={32} />
        </motion.div>

        <h1 className="text-heading-lg font-serif font-bold text-gray-800 mb-2">
          Room <span className="text-romantic-pink tracking-widest">{roomCode}</span>
        </h1>
        <p className="text-gray-500 mb-10 font-medium">Waiting for your partner to connect...</p>

        {/* Players Section - Responsive */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 px-4 relative gap-6 sm:gap-0">
          {/* Player 1 */}
          <ProfileCard username="You" status="ready" size="lg" placeholder="Y" />

          {/* Connection Line & Pulse */}
          <div className="hidden sm:flex flex-grow items-center justify-center relative mx-4">
            <div className="absolute w-full h-1 bg-gray-200 rounded-full"></div>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute w-full h-1 bg-gradient-to-r from-romantic-pink to-romantic-peach rounded-full origin-left opacity-50"
            />
            <motion.div
               animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className="z-10 bg-white p-2 rounded-full shadow-md text-romantic-pink border border-pink-100"
            >
               <Heart size={20} fill="currentColor" />
            </motion.div>
          </div>

          {/* Vertical pulse for mobile */}
          <motion.div 
            className="sm:hidden"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Heart size={28} className="text-romantic-pink" fill="currentColor" />
          </motion.div>

          {/* Player 2 */}
          <ProfileCard username="Partner" status="waiting" size="lg" placeholder="?" />
        </div>

        <div className="space-y-4">
          <RomanticButton variant="secondary" fullWidth onClick={copyLink}>
            <Copy size={20} /> Copy Connection Link
          </RomanticButton>
          
          <RomanticButton variant="primary" fullWidth onClick={startGame}>
            <Play size={20} fill="currentColor" /> Begin Experience
          </RomanticButton>
        </div>
      </GlassCard>
    </div>
  );
}
