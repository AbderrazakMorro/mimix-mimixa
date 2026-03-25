'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, RefreshCw, Home, Sparkles, Star } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';

// Heart-shaped Confetti
const Confetti = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return null;

  const pieces = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    delay: Math.random() * 0.5,
    duration: Math.random() * 3 + 2,
    color: ['#FF6B8A', '#FF8FA3', '#CDB4DB', '#FFC8A2', '#FFD166'][Math.floor(Math.random() * 5)],
    size: Math.random() * 12 + 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: p.x, opacity: 1, rotate: 0 }}
          animate={{ y: window.innerHeight + 20, x: p.x + (Math.random() - 0.5) * 200, opacity: 0, rotate: 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          className="absolute top-0"
        >
          <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill={p.color}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

export default function ResultsPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const adult = searchParams.get('adult') === 'true';
  const count = searchParams.get('count') || '10';
  const score = 85;

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({length: 6}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const playAgainSame = () => {
    router.push(`/game/${roomCode}?adult=${adult}&count=${count}`);
  };

  const playAgainNew = () => {
    router.push(`/room/${generateRoomCode()}?adult=${adult}&count=${count}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-6 text-center relative overflow-hidden">
      <AnimatedBackground motif="butterflies" intensity="medium" />
      <Confetti />

      <GlassCard strong className="max-w-xl w-full relative z-10">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-romantic-pink via-romantic-lavender to-romantic-peach rounded-t-[2rem]"></div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="mx-auto w-20 h-20 bg-gradient-to-br from-romantic-gold to-yellow-200 text-yellow-700 rounded-full flex items-center justify-center mb-6 glow-gold"
        >
          <Sparkles size={40} className="animate-pulse" />
        </motion.div>

        <h1 className="text-heading-lg font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-romantic-pink to-romantic-lavender mb-2 drop-shadow-sm">
          Soulmate Score
        </h1>
        <p className="text-gray-500 mb-8 font-medium bg-white/50 px-4 py-1 rounded-full inline-block border border-white">
          Connection: <span className="text-romantic-pink tracking-widest">{roomCode}</span>
        </p>

        {/* Animated Heart Fill Score */}
        <div className="relative w-36 h-36 xs:w-44 xs:h-44 md:w-56 md:h-56 mx-auto flex items-center justify-center mb-6 sm:mb-8 md:mb-10">
          <motion.svg className="absolute inset-0 w-full h-full drop-shadow-lg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,107,138,0.1)" strokeWidth="6" />
            <motion.circle 
              cx="50" cy="50" r="46" 
              fill="none" 
              stroke="url(#gradient)" 
              strokeWidth="8"
              strokeDasharray="289"
              initial={{ strokeDashoffset: 289 }}
              animate={{ strokeDashoffset: 289 - (289 * score) / 100 }}
              transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
              transform="rotate(-90 50 50)"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF6B8A" />
                <stop offset="100%" stopColor="#CDB4DB" />
              </linearGradient>
            </defs>
          </motion.svg>
          <div className="absolute flex flex-col items-center justify-center">
            <div className="text-4xl xs:text-5xl md:text-6xl font-black text-romantic-pink drop-shadow-sm font-serif pointer-events-none">
              {score}<span className="text-xl xs:text-2xl md:text-3xl">%</span>
            </div>
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -bottom-1 -right-1 xs:-bottom-2 xs:-right-2 text-romantic-pink opacity-80"
          >
            <Heart size={32} className="xs:w-[40px] xs:h-[40px]" fill="currentColor" />
          </motion.div>
        </div>

        {/* Insight Cards - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8 text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            whileHover={{ scale: 1.03 }} 
            className="bg-white/80 p-4 rounded-2xl border border-pink-100 shadow-sm relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 opacity-10 text-romantic-gold"><Star size={64} fill="currentColor" /></div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Romance Match</h4>
            <div className="text-2xl font-black text-romantic-pink">92%</div>
            <p className="text-xs text-gray-400 mt-1">Perfect Harmony</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            whileHover={{ scale: 1.03 }} 
            className="bg-white/80 p-4 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 opacity-10 text-romantic-lavender"><Heart size={64} fill="currentColor" /></div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Fun Factor</h4>
            <div className="text-2xl font-black text-romantic-lavender">78%</div>
            <p className="text-xs text-gray-400 mt-1">Great Energy</p>
          </motion.div>
        </div>

        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-5 md:p-6 mb-8 md:mb-10 border border-pink-100 shadow-inner">
          <h3 className="text-lg md:text-xl font-serif font-bold text-romantic-pink mb-2 flex items-center justify-center gap-2">
            <Sparkles size={20} /> Incredible Connection!
          </h3>
          <p className="text-gray-700 leading-relaxed font-medium text-sm md:text-base">
            You two are truly something special! Your responses show a deep understanding of each other's needs and a perfect balance of passion and fun. Keep the love glowing! 💖
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <RomanticButton variant="primary" fullWidth onClick={playAgainSame}>
            <RefreshCw size={20} /> Rematch (Same Room)
          </RomanticButton>
          <div className="flex gap-3 md:gap-4">
            <Link href="/" className="flex-1">
              <RomanticButton variant="ghost" fullWidth className="border-2 border-gray-200 hover:border-gray-300">
                <Home size={20} /> Exit
              </RomanticButton>
            </Link>
            <div className="flex-1">
              <RomanticButton variant="secondary" fullWidth onClick={playAgainNew}>
                <Sparkles size={20} /> New Session
              </RomanticButton>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
