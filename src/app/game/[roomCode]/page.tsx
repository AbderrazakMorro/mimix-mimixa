'use client';

import { useState, use, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ALL_QUESTIONS, Question } from '@/data/questions';
import QuestionCard from '@/components/QuestionCard';
import AnimatedBackground from '@/components/AnimatedBackground';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function GamePage({ params }: { params: Promise<{ roomCode: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { roomCode } = use(params);
  
  const adult = searchParams.get('adult') === 'true';
  const count = parseInt(searchParams.get('count') || '10', 10);

  const QUESTIONS = useMemo(() => {
    let q = ALL_QUESTIONS;
    if (!adult) {
      q = q.filter((x: Question) => !x.is_adult);
    }
    const hash = (str: string) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      return h;
    };
    q = [...q].sort((a, b) => hash(a.question_text + roomCode) - hash(b.question_text + roomCode));
    return q.slice(0, count).map((x, idx) => ({ ...x, id: idx + 1 }));
  }, [adult, count, roomCode]);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [playerAnswer, setPlayerAnswer] = useState<string | null>(null);
  const [partnerAnswered, setPartnerAnswered] = useState(false);

  const handleAnswer = (option: string) => {
    setPlayerAnswer(option);
    setTimeout(() => {
      setPartnerAnswered(true);
      setTimeout(() => {
        if (currentQuestionIdx < QUESTIONS.length - 1) {
          setCurrentQuestionIdx(prev => prev + 1);
          setPlayerAnswer(null);
          setPartnerAnswered(false);
        } else {
          router.push(`/results/${roomCode}`);
        }
      }, 3000);
    }, 1500);
  };

  const currentQuestion = QUESTIONS[currentQuestionIdx];
  const progressPercent = QUESTIONS.length > 0 ? ((currentQuestionIdx + 1) / QUESTIONS.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <AnimatedBackground motif="hearts" intensity="low" />
      
      {/* Header with Progress */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-xl mb-6 md:mb-8 flex flex-col gap-3 md:gap-4 relative z-10"
      >
        <div className="flex justify-between items-center glass p-4 md:p-5 rounded-2xl">
          <div className="text-romantic-pink font-serif font-bold text-lg md:text-xl">
            Room: <span className="tracking-widest">{roomCode}</span>
          </div>
          <div className="text-gray-500 font-medium bg-white px-3 md:px-4 py-1.5 rounded-full shadow-inner text-xs md:text-sm">
            {currentQuestionIdx + 1} / {QUESTIONS.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden shadow-inner backdrop-blur-md">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-romantic-pink via-romantic-rose to-romantic-peach rounded-full"
          />
        </div>
      </motion.div>

      <div className="relative z-10 w-full flex justify-center">
        {currentQuestion && (
          <QuestionCard 
            question={currentQuestion} 
            onAnswer={handleAnswer} 
            selectedAnswer={playerAnswer}
            partnerAnswered={partnerAnswered}
          />
        )}
      </div>
      
      {/* Footer Status Indicators */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-lg mt-8 md:mt-10 grid grid-cols-2 gap-3 md:gap-4 relative z-10"
      >
        <div className={`flex flex-col items-center p-3 md:p-4 rounded-2xl backdrop-blur-md transition-all duration-300 ${playerAnswer ? 'glass-strong' : 'bg-white/40 border border-transparent'}`}>
          <motion.div
            animate={playerAnswer ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: playerAnswer ? Infinity : 0, duration: 1.2 }}
          >
            <Heart size={20} className={playerAnswer ? 'text-romantic-pink' : 'text-gray-300'} fill={playerAnswer ? 'currentColor' : 'none'} />
          </motion.div>
          <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">You</span>
        </div>
        <div className={`flex flex-col items-center p-3 md:p-4 rounded-2xl backdrop-blur-md transition-all duration-300 ${partnerAnswered ? 'glass-strong' : 'bg-white/40 border border-transparent'}`}>
          <motion.div
            animate={partnerAnswered ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: partnerAnswered ? Infinity : 0, duration: 1.2 }}
          >
            <Heart size={20} className={partnerAnswered ? 'text-romantic-pink' : 'text-pink-100'} fill={partnerAnswered ? 'currentColor' : 'none'} />
          </motion.div>
          <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Partner</span>
        </div>
      </motion.div>
    </div>
  );
}
