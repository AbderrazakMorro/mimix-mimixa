'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, RefreshCw, Home, Sparkles, Star, Loader2 } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ALL_QUESTIONS } from '@/data/questions';
import { Question } from '@/types/game';

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

type AnswerPair = {
  questionIndex: number;
  questionText: string;
  category: string;
  playerAnswer: string;
  partnerAnswer: string;
  isMatch: boolean;
};

function getScoreMessage(score: number): { title: string; message: string } {
  if (score >= 90) return { title: "Soulmates! 🔥", message: "You two share an extraordinary bond. Your minds are perfectly in sync!" };
  if (score >= 75) return { title: "Incredible Connection! ✨", message: "You truly understand each other's hearts. Your compatibility is remarkable!" };
  if (score >= 60) return { title: "Strong Bond! 💕", message: "You have a wonderful connection with room to discover even more about each other." };
  if (score >= 40) return { title: "Interesting Contrast! 🌟", message: "Your differences make things exciting. There's so much to explore together!" };
  return { title: "Opposites Attract! 🎭", message: "You see the world differently, and that's beautiful. Every answer is a chance to learn." };
}

export default function ResultsPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { user, loading: userLoading } = useCurrentUser();

  const [score, setScore] = useState<number | null>(null);
  const [answerPairs, setAnswerPairs] = useState<AnswerPair[]>([]);
  const [categoryScores, setCategoryScores] = useState<Record<string, { matches: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || userLoading) return;

    async function fetchResults() {
      // Get session
      const { data: session } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (!session) {
        setLoading(false);
        return;
      }

      // Build questions list (same deterministic order)
      const adult = session.include_adult;
      const count = session.question_count;
      let q = ALL_QUESTIONS as Question[];
      if (!adult) q = q.filter((x) => !x.is_adult);
      const hash = (str: string) => {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
        return h;
      };
      const round = session.round ?? 1;
      q = [...q].sort((a, b) => hash(a.question_text + roomCode + round) - hash(b.question_text + roomCode + round));
      const questions = q.slice(0, count);

      // Fetch all answers for this session
      const { data: allAnswers } = await supabase
        .from('answers')
        .select('*')
        .eq('session_id', session.id)
        .order('question_id', { ascending: true });

      if (!allAnswers) {
        setLoading(false);
        return;
      }

      // Build pairs
      const pairs: AnswerPair[] = [];
      const catScores: Record<string, { matches: number; total: number }> = {};

      for (let i = 0; i < questions.length; i++) {
        const qAnswers = allAnswers.filter((a: { question_id: number }) => a.question_id === i);
        if (qAnswers.length < 2) continue;

        const myAnswer = qAnswers.find((a: { player_id: string }) => a.player_id === user!.id);
        const theirAnswer = qAnswers.find((a: { player_id: string }) => a.player_id !== user!.id);

        if (!myAnswer || !theirAnswer) continue;

        const isMatch = myAnswer.selected_option === theirAnswer.selected_option;
        const cat = questions[i].category;

        pairs.push({
          questionIndex: i,
          questionText: questions[i].question_text,
          category: cat,
          playerAnswer: myAnswer.selected_option,
          partnerAnswer: theirAnswer.selected_option,
          isMatch,
        });

        if (!catScores[cat]) catScores[cat] = { matches: 0, total: 0 };
        catScores[cat].total++;
        if (isMatch) catScores[cat].matches++;
      }

      const totalMatches = pairs.filter((p) => p.isMatch).length;
      const totalQuestions = pairs.length;
      const pct = totalQuestions > 0 ? Math.round((totalMatches / totalQuestions) * 100) : 0;

      setScore(pct);
      setAnswerPairs(pairs);
      setCategoryScores(catScores);
      setLoading(false);
    }

    fetchResults();
  }, [user, userLoading, roomCode, supabase]);

  const playAgain = async () => {
    if (!user) return;
    try {
      // Get sesssion ID
      const { data: session } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('room_code', roomCode)
        .single();

      if (!session) return;

      const res = await fetch('/api/game/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/game/${data.roomCode}`);
    } catch {
      router.push('/create-room');
    }
  };

  const scoreMessage = getScoreMessage(score ?? 0);

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <GlassCard className="text-center">
          <Loader2 className="mx-auto text-romantic-pink w-10 h-10 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Calculating your compatibility...</p>
        </GlassCard>
      </div>
    );
  }

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

        {/* Animated Score Ring */}
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
              animate={{ strokeDashoffset: 289 - (289 * (score ?? 0)) / 100 }}
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

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8 text-left">
          {Object.entries(categoryScores).map(([cat, data], idx) => {
            const pct = Math.round((data.matches / data.total) * 100);
            const colors = [
              { bg: 'pink-100', text: 'romantic-pink', icon: <Heart size={48} fill="currentColor" /> },
              { bg: 'purple-100', text: 'romantic-lavender', icon: <Star size={48} fill="currentColor" /> },
              { bg: 'amber-100', text: 'romantic-gold', icon: <Sparkles size={48} /> },
              { bg: 'rose-100', text: 'romantic-rose', icon: <Heart size={48} fill="currentColor" /> },
            ];
            const c = colors[idx % colors.length];
            
            return (
              <motion.div 
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 + idx * 0.2 }}
                whileHover={{ scale: 1.03 }} 
                className={`bg-white/80 p-4 rounded-2xl border border-${c.bg} shadow-sm relative overflow-hidden`}
              >
                <div className={`absolute -right-4 -top-4 opacity-10 text-${c.text}`}>{c.icon}</div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{cat}</h4>
                <div className={`text-2xl font-black text-${c.text}`}>{pct}%</div>
                <p className="text-xs text-gray-400 mt-1">{data.matches}/{data.total} matches</p>
              </motion.div>
            );
          })}
        </div>

        {/* Insight Message */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-5 md:p-6 mb-8 md:mb-10 border border-pink-100 shadow-inner">
          <h3 className="text-lg md:text-xl font-serif font-bold text-romantic-pink mb-2 flex items-center justify-center gap-2">
            <Sparkles size={20} /> {scoreMessage.title}
          </h3>
          <p className="text-gray-700 leading-relaxed font-medium text-sm md:text-base">
            {scoreMessage.message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3 md:gap-4">
            <Link href="/" className="flex-1">
              <RomanticButton variant="ghost" fullWidth className="border-2 border-gray-200 hover:border-gray-300">
                <Home size={20} /> Exit
              </RomanticButton>
            </Link>
            <div className="flex-1">
              <RomanticButton variant="primary" fullWidth onClick={playAgain}>
                <RefreshCw size={20} /> Play Again
              </RomanticButton>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
