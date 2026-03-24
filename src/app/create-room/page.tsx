'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import { Sparkles, Settings2 } from 'lucide-react';

export default function CreateRoomPage() {
  const router = useRouter();
  const [includeAdult, setIncludeAdult] = useState(false);
  const [questionCount, setQuestionCount] = useState<10 | 20>(10);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    setTimeout(() => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      router.push(`/room/${result}?adult=${includeAdult}&count=${questionCount}`);
    }, 1200);
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
