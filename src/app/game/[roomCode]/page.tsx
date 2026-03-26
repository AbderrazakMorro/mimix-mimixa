'use client';

import { useState, useEffect, use, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_QUESTIONS } from '@/data/questions';
import { Question } from '@/types/game';
import QuestionCard from '@/components/QuestionCard';
import AnimatedBackground from '@/components/AnimatedBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useGameSession } from '@/hooks/useGameSession';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function GamePage({ params }: { params: Promise<{ roomCode: string }> }) {
  const router = useRouter();
  const { roomCode } = use(params);
  const { user, loading: userLoading } = useCurrentUser();

  const {
    session,
    players,
    loading: sessionLoading,
    partnerAnswered,
    partnerAnswer,
    submitAnswer,
  } = useGameSession({
    roomCode,
    userId: user?.id ?? '',
  });

  // Identify players
  const me = players.find(p => p.player_id === user?.id);
  const partner = players.find(p => p.player_id !== user?.id);
  const partnerName = partner?.profiles?.display_name || partner?.profiles?.username || "Partner";
  const myName = me?.profiles?.display_name || me?.profiles?.username || "You";

  const [playerAnswer, setPlayerAnswer] = useState<string | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [revealData, setRevealData] = useState<{
    partnerAnswer: string;
    isMatch: boolean;
    questionText: string;
    questionNumber: number;
    myAnswer: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track which question index we're currently displaying/answering
  const [displayedQuestionIdx, setDisplayedQuestionIdx] = useState<number>(0);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build deterministic question list from room code
  const QUESTIONS = useMemo(() => {
    if (!session) return [];
    const adult = session.include_adult;
    const count = session.question_count;

    let q = ALL_QUESTIONS as Question[];
    if (!adult) {
      q = q.filter((x: Question) => !x.is_adult);
    }
    const hash = (str: string) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      return h;
    };
    const round = session.round ?? 1;
    q = [...q].sort((a, b) => hash(a.question_text + roomCode + round) - hash(b.question_text + roomCode + round));
    return q.slice(0, count).map((x, idx) => ({ ...x, id: idx + 1 }));
  }, [session?.include_adult, session?.question_count, session?.round, roomCode, session]);

  const serverQuestionIdx = session?.current_question_index ?? 0;
  const currentQuestion = QUESTIONS[displayedQuestionIdx];
  const progressPercent = QUESTIONS.length > 0 ? ((displayedQuestionIdx + 1) / QUESTIONS.length) * 100 : 0;

  // Helper: trigger 5-second reveal then advance
  const triggerReveal = useCallback((data: {
    partnerAnswer: string;
    isMatch: boolean;
    questionText: string;
    questionNumber: number;
    myAnswer: string;
  }) => {
    if (showReveal) return; // already showing
    setRevealData(data);
    setShowReveal(true);

    // Clear any existing timer
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);

    // After 5 seconds, dismiss reveal and advance to the server's current index
    revealTimerRef.current = setTimeout(() => {
      setShowReveal(false);
      setRevealData(null);
      setPlayerAnswer(null);
      setIsSubmitting(false);
      // Jump to whatever the server says is the current question
      setDisplayedQuestionIdx(serverQuestionIdx);
    }, 5000);
  }, [showReveal, serverQuestionIdx]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  // Sync displayedQuestionIdx with server ONLY when NOT in reveal mode
  useEffect(() => {
    if (!showReveal) {
      setDisplayedQuestionIdx(serverQuestionIdx);
    }
  }, [serverQuestionIdx, showReveal]);

  // When partner answers via Realtime and we've also answered locally, show reveal
  useEffect(() => {
    if (playerAnswer && partnerAnswered && partnerAnswer && !showReveal && currentQuestion) {
      const isMatch = playerAnswer === partnerAnswer;
      triggerReveal({
        partnerAnswer,
        isMatch,
        questionText: currentQuestion.question_text,
        questionNumber: displayedQuestionIdx + 1,
        myAnswer: playerAnswer,
      });
    }
  }, [playerAnswer, partnerAnswered, partnerAnswer, showReveal, currentQuestion, displayedQuestionIdx, triggerReveal]);

  // Navigate to results when game completes (after reveal finishes)
  useEffect(() => {
    if (session?.status === 'completed' && !showReveal) {
      router.push(`/results/${roomCode}`);
    }
  }, [session?.status, showReveal, roomCode, router]);

  const isSubmittingRef = useRef(false);

  const handleAnswer = useCallback(async (option: string) => {
    if (isSubmitting || isSubmittingRef.current || playerAnswer) return;
    
    setPlayerAnswer(option);
    setIsSubmitting(true);
    isSubmittingRef.current = true;

    try {
      const answeredQuestion = currentQuestion;
      const answeredIdx = displayedQuestionIdx;
      const result = await submitAnswer(answeredIdx, option);

      if (result.bothAnswered && result.partnerAnswer && answeredQuestion) {
        triggerReveal({
          partnerAnswer: result.partnerAnswer,
          isMatch: result.isMatch ?? false,
          questionText: answeredQuestion.question_text,
          questionNumber: answeredIdx + 1,
          myAnswer: option,
        });
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      // If it's already answered, don't allow selecting another one
      if (err instanceof Error && err.message.includes('Already answered')) {
        setIsSubmitting(true); // Keep it locked
        isSubmittingRef.current = true;
      }
    }
  }, [isSubmitting, playerAnswer, displayedQuestionIdx, submitAnswer, currentQuestion, triggerReveal]);

  if (sessionLoading || userLoading || !session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <AnimatedBackground motif="hearts" intensity="low" />
        <div className="glass-strong rounded-2xl p-8 text-center relative z-10">
          <Loader2 className="mx-auto text-romantic-pink w-10 h-10 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <AnimatedBackground motif="hearts" intensity="low" />
      
      {/* Header with Progress */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-xl mb-6 md:mb-8 flex flex-col gap-3 md:gap-4 relative z-10"
      >
        <div className="flex justify-between items-center glass p-4 md:p-5 rounded-2xl text-[10px] md:text-sm">
          <div className="text-romantic-pink font-serif font-bold text-lg md:text-xl">
            Room: <span className="tracking-widest">{roomCode}</span>
          </div>
          <div className="text-gray-500 font-medium bg-white px-3 md:px-4 py-1.5 rounded-full shadow-inner">
            {displayedQuestionIdx + 1} / {QUESTIONS.length}
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

      {/* Question / Reveal */}
      <div className="relative z-10 w-full flex justify-center">
        <AnimatePresence mode="wait">
          {showReveal && revealData ? (
            <motion.div
              key={`reveal-${displayedQuestionIdx}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-lg glass-strong rounded-[2rem] p-6 md:p-8"
            >
              {/* Match Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className="flex justify-center mb-6"
              >
                {revealData.isMatch ? (
                  <div className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-full border-2 border-emerald-200 shadow-md">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                    <span className="text-emerald-700 font-bold text-lg">Match! 💕</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-full border-2 border-orange-200 shadow-md">
                    <XCircle size={24} className="text-orange-500" />
                    <span className="text-orange-700 font-bold text-lg">Different! 🤷</span>
                  </div>
                )}
              </motion.div>

              <h3 className="text-center text-gray-500 font-medium text-sm uppercase tracking-wider mb-6">
                Question {revealData.questionNumber}
              </h3>

              <h2 className="text-heading-md font-serif font-bold text-gray-800 mb-8 leading-relaxed text-center" dir="rtl">
                {revealData.questionText}
              </h2>

              {/* Answers Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Your Answer */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md border-2 border-white overflow-hidden ${me?.profiles?.avatar_url ? 'bg-white' : 'bg-gradient-to-br from-romantic-pink to-romantic-rose'}`}>
                    {me?.profiles?.avatar_url ? (
                      <img src={me.profiles.avatar_url} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <Heart size={20} className="text-white" fill="currentColor" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 truncate max-w-full">{myName}</span>
                  <div className="w-full p-3 bg-pink-50 border-2 border-romantic-pink rounded-xl text-romantic-pink font-medium text-sm text-center" dir="rtl">
                    {revealData.myAnswer}
                  </div>
                </motion.div>

                {/* Partner Answer */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md border-2 border-white overflow-hidden ${partner?.profiles?.avatar_url ? 'bg-white' : 'bg-gradient-to-br from-romantic-lavender to-purple-300'}`}>
                    {partner?.profiles?.avatar_url ? (
                      <img src={partner.profiles.avatar_url} alt="Partner" className="w-full h-full object-cover" />
                    ) : (
                      <Heart size={20} className="text-white" fill="currentColor" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 truncate max-w-full">{partnerName}</span>
                  <div className="w-full p-3 bg-purple-50 border-2 border-romantic-lavender rounded-xl text-romantic-lavender font-medium text-sm text-center" dir="rtl">
                    {revealData.partnerAnswer}
                  </div>
                </motion.div>
              </div>

              {/* Auto-advance indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 flex items-center justify-center gap-2 text-gray-400 text-sm font-medium"
              >
                <Loader2 size={14} className="animate-spin" />
                <span>{session?.status === 'completed' ? 'Finalizing results...' : 'Next question coming...'}</span>
              </motion.div>
            </motion.div>
          ) : (
            <QuestionCard 
              key={`q-${displayedQuestionIdx}`}
              question={currentQuestion} 
              onAnswer={handleAnswer} 
              selectedAnswer={playerAnswer}
              partnerAnswered={partnerAnswered}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer Status Indicators */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-lg mt-8 md:mt-10 grid grid-cols-2 gap-3 md:gap-4 relative z-10"
      >
        <div className={`flex flex-col items-center p-3 md:p-4 rounded-2xl backdrop-blur-md transition-all duration-300 ${playerAnswer ? 'glass-strong shadow-lg' : 'bg-white/40 border border-transparent'}`}>
          <div className="relative group">
            <motion.div
              animate={playerAnswer ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: playerAnswer ? Infinity : 0, duration: 1.2 }}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden ${me?.profiles?.avatar_url ? 'bg-white' : 'bg-gradient-to-br from-romantic-pink to-romantic-rose'}`}
            >
              {me?.profiles?.avatar_url ? (
                <img src={me.profiles.avatar_url} alt="You" className="w-full h-full object-cover" />
              ) : (
                <Heart size={18} className={playerAnswer ? 'text-white' : 'text-gray-200'} fill={playerAnswer ? 'currentColor' : 'none'} />
              )}
            </motion.div>
            {playerAnswer && (
              <div className="absolute -top-1 -right-1 bg-green-400 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white shadow-sm animate-pulse" />
            )}
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">{myName}</span>
        </div>

        <div className={`flex flex-col items-center p-3 md:p-4 rounded-2xl backdrop-blur-md transition-all duration-300 ${partnerAnswered ? 'glass-strong shadow-lg' : 'bg-white/40 border border-transparent'}`}>
          <div className="relative group">
            <motion.div
              animate={partnerAnswered ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: partnerAnswered ? Infinity : 0, duration: 1.2 }}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden ${partner?.profiles?.avatar_url ? 'bg-white' : 'bg-gradient-to-br from-romantic-lavender to-purple-300'}`}
            >
              {partner?.profiles?.avatar_url ? (
                <img src={partner.profiles.avatar_url} alt="Partner" className="w-full h-full object-cover" />
              ) : (
                <Heart size={18} className={partnerAnswered ? 'text-white' : 'text-pink-100'} fill={partnerAnswered ? 'currentColor' : 'none'} />
              )}
            </motion.div>
            {partnerAnswered && (
              <div className="absolute -top-1 -right-1 bg-green-400 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white shadow-sm animate-pulse" />
            )}
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">{partnerName}</span>
        </div>
      </motion.div>
    </div>
  );
}
