'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import { HeartHandshake, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function JoinRoomPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length === 0) return;

    setIsJoining(true);
    setError(null);

    try {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: roomCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join room');

      router.push(`/room/${data.roomCode}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <AnimatedBackground motif="tulips" intensity="low" />
      <GlassCard className="max-w-md w-full text-center relative z-10">
        <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ delay: 0.2, type: 'spring' }}
           className="mx-auto text-romantic-pink mb-4"
        >
          <HeartHandshake size={56} className="mx-auto drop-shadow-sm" />
        </motion.div>
        
        <h1 className="text-heading-md font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-romantic-pink to-romantic-lavender mb-2 drop-shadow-sm">
          Join Connection
        </h1>
        <p className="text-gray-500 mb-8 font-medium">
          Enter the secret code shared by your partner.
        </p>

        <form onSubmit={handleJoin} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
          
          <div>
            <input
              type="text"
              placeholder="e.g. A1B2C3"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-4 text-center text-2xl font-bold rounded-2xl border-2 border-pink-100 bg-white/80 focus:border-romantic-pink focus:outline-none focus:ring-4 focus:ring-romantic-pink/20 uppercase tracking-[0.3em] text-gray-800 transition-all placeholder-gray-300 shadow-inner"
            />
          </div>
          <RomanticButton type="submit" fullWidth disabled={roomCode.trim().length === 0 || isJoining}>
            {isJoining ? 'Joining...' : 'Enter Room'}
          </RomanticButton>
        </form>
        
        <button
          onClick={() => router.push('/')}
          className="mt-6 text-sm text-gray-400 hover:text-romantic-pink transition-colors font-medium"
        >
          Back to Start
        </button>
      </GlassCard>
    </div>
  );
}
