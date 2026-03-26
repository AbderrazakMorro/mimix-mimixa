'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import { Sparkles, Settings2, Heart } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';

export default function CreateRoomPage() {
  const router = useRouter();
  const [includeAdult, setIncludeAdult] = useState(false);
  const [questionCount, setQuestionCount] = useState<10 | 20>(10);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { relationship, sendGameInvite } = useProfile() || {};

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionCount, includeAdult }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');

      router.push(`/room/${data.roomCode}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <AnimatedBackground motif="butterflies" intensity="low" />
        <GlassCard className="text-center relative z-10">
          <Sparkles className="mx-auto text-romantic-gold w-12 h-12 mb-4 animate-pulse" />
          <h1 className="text-heading-md font-serif font-bold text-romantic-pink mb-4">
            Creating Magic...
          </h1>
          <div className="mx-auto w-10 h-10 border-4 border-romantic-pink/30 border-t-romantic-pink rounded-full animate-spin"></div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <AnimatedBackground motif="butterflies" intensity="low" />
      <GlassCard className="max-w-md w-full relative z-10">
        <div className="flex items-center gap-3 justify-center mb-6">
          <Settings2 className="text-romantic-pink w-8 h-8" />
          <h1 className="text-heading-md font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-romantic-pink to-romantic-lavender drop-shadow-sm">
            Experience Setup
          </h1>
        </div>
        
        <form onSubmit={handleCreate} className="space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* +18 Toggle */}
            <motion.div whileHover={{ scale: 1.01 }} className="p-5 bg-white/80 rounded-2xl border border-pink-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Spicy Mode (+18)</p>
                <p className="text-xs text-gray-500 mt-1">Deeper, more intimate questions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={includeAdult} onChange={(e) => setIncludeAdult(e.target.checked)} />
                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-romantic-pink shadow-inner"></div>
              </label>
            </motion.div>

            {/* Questions count */}
            <motion.div whileHover={{ scale: 1.01 }} className="p-5 bg-white/80 rounded-2xl border border-pink-100 shadow-sm">
              <p className="font-semibold text-gray-800 mb-4">Journey Length</p>
              <div className="flex gap-4">
                <button type="button" onClick={() => setQuestionCount(10)} className={`flex-1 py-3 hover:scale-[1.02] rounded-xl font-bold border-2 transition-all shadow-sm ${questionCount === 10 ? 'border-romantic-pink bg-pink-50 text-romantic-pink glow-pink' : 'border-gray-100 text-gray-500 hover:border-pink-200'}`}>10 Questions</button>
                <button type="button" onClick={() => setQuestionCount(20)} className={`flex-1 py-3 hover:scale-[1.02] rounded-xl font-bold border-2 transition-all shadow-sm ${questionCount === 20 ? 'border-romantic-pink bg-pink-50 text-romantic-pink glow-pink' : 'border-gray-100 text-gray-500 hover:border-pink-200'}`}>20 Questions</button>
              </div>
            </motion.div>
          </div>

          <RomanticButton type="submit" fullWidth>
            Generate Connection Link
          </RomanticButton>

          {relationship && relationship.otherPerson && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center mb-3">Or Play with Partner</p>
              <button
                type="button"
                onClick={() => sendGameInvite(relationship.otherPerson.id, { questionCount, includeAdult })}
                className="w-full py-4 rounded-2xl bg-romantic-lavender/10 text-romantic-lavender border-2 border-romantic-lavender/20 font-black text-sm hover:bg-romantic-lavender/20 transition-all flex items-center justify-center gap-2 group shadow-sm"
              >
                <Heart size={18} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                Invite {relationship.otherPerson.display_name} to Play
              </button>
            </div>
          )}
        </form>
        
        <div className="mt-6 text-center">
          <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-romantic-pink transition-colors font-medium">
            Cancel
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
