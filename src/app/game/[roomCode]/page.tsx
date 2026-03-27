'use client';

import { useState, useEffect, use, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_QUESTIONS } from '@/data/questions';
import { Question } from '@/types/game';
import QuestionCard from '@/components/QuestionCard';
import AnimatedBackground from '@/components/AnimatedBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2, CheckCircle2, XCircle, User, Sparkles, Check } from 'lucide-react';
import { useGameSession } from '@/hooks/useGameSession';
import { useCurrentUser } from '@/hooks/useCurrentUser';

import { useProfile } from '@/contexts/ProfileContext';

export default function GamePage({ params }: { params: Promise<{ roomCode: string }> }) {
  const router = useRouter();
  const { roomCode } = use(params);
  const { profile, relationship, loading: profileLoading } = useProfile();

  const {
    session,
    players,
    loading: sessionLoading,
    partnerAnswered,
    partnerAnswer,
    submitAnswer,
  } = useGameSession({
    roomCode,
    userId: profile?.id ?? '',
  });

  // Identify players
  const me = profile;
  const partner = relationship?.otherPerson;
  const partnerName = partner?.display_name || partner?.username || "Partner";
  const myName = me?.display_name || me?.username || "You";

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

  if (sessionLoading || profileLoading || !session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <AnimatedBackground motif="hearts" intensity="low" />
        <div className="glass-strong rounded-2xl p-8 text-center relative z-10 px-12 py-10 shadow-2xl">
          <Loader2 className="mx-auto text-romantic-pink w-10 h-10 animate-spin mb-4" />
          <p className="text-gray-500 font-bold text-sm">Initializing hearts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-20 pb-8 px-4 md:px-6 overflow-hidden relative">
      <AnimatedBackground motif="hearts" intensity="low" />
      
      {/* Header with Progress */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-xl mb-4 md:mb-8 flex flex-col gap-4 relative z-20"
      >
        <div className="flex flex-col gap-2 glass p-3 md:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/40 shadow-xl backdrop-blur-xl">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-romantic-pink/10 rounded-lg">
                <Heart size={16} className="text-romantic-pink" fill="currentColor" />
              </div>
              <div className="text-romantic-pink font-serif font-black text-lg md:text-2xl tracking-tight">
                Room <span className="tracking-widest uppercase ml-1 opacity-80">{roomCode}</span>
              </div>
            </div>
            <div className="text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-gray-400 bg-white/60 px-3 py-1.5 rounded-full border border-white shadow-inner">
              <span className="text-romantic-pink font-serif text-xs md:text-lg">{displayedQuestionIdx + 1}</span> / {QUESTIONS.length}
            </div>
          </div>
          
          {/* Progress Bar Container */}
          <div className="relative h-2 w-full bg-gray-100/50 rounded-full overflow-hidden shadow-inner border border-white/20">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              className="h-full bg-gradient-to-r from-romantic-pink via-romantic-rose to-romantic-peach rounded-full shadow-[0_0_10px_rgba(255,107,138,0.4)]"
            />
          </div>
        </div>
      </motion.div>

      {/* Question / Reveal */}
      <div className="relative z-10 w-full flex justify-center flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {showReveal && revealData ? (
            <motion.div
              key={`reveal-${displayedQuestionIdx}`}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-xl glass-strong rounded-[2rem] p-5 md:p-10 shadow-3xl border border-white/50 relative overflow-hidden flex flex-col justify-center"
            >
              {/* Decorative background glow */}
              <div className={`absolute -top-20 -right-20 w-64 h-64 blur-3xl rounded-full opacity-20 pointer-events-none ${revealData.isMatch ? 'bg-emerald-400' : 'bg-orange-400'}`} />
              <div className={`absolute -bottom-20 -left-20 w-64 h-64 blur-3xl rounded-full opacity-20 pointer-events-none ${revealData.isMatch ? 'bg-emerald-300' : 'bg-orange-300'}`} />

              {/* Match Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                className="flex justify-center mb-4 sm:mb-8"
              >
                {revealData.isMatch ? (
                  <div className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full text-white shadow-xl glow-emerald scale-90 sm:scale-100">
                    <CheckCircle2 size={20} fill="white" className="text-emerald-500" />
                    <span className="text-sm sm:text-lg font-black uppercase tracking-wider">Perfect Match! 💕</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full text-white shadow-xl glow-orange scale-90 sm:scale-100">
                    <XCircle size={20} fill="white" className="text-orange-500" />
                    <span className="text-sm sm:text-lg font-black uppercase tracking-wider">Different Vibes! 🤷‍♂️</span>
                  </div>
                )}
              </motion.div>

              <h2 className="text-base sm:text-2xl font-serif font-black text-gray-800 mb-6 sm:mb-10 leading-relaxed text-center drop-shadow-sm px-4" dir="rtl">
                {revealData.questionText}
              </h2>

              {/* Answers Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-8 mb-6 sm:mb-10">
                {/* Your Answer */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center gap-2 sm:gap-4"
                >
                  <div className="relative">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white border-2 sm:border-4 border-white shadow-xl overflow-hidden ring-2 sm:ring-4 ring-romantic-pink/10">
                      {me?.avatar_url ? (
                        <img src={me.avatar_url} alt="You" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-romantic-pink to-romantic-rose text-white">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 sm:p-1 rounded-full shadow-md text-romantic-pink border border-pink-50">
                      <Heart size={10} className="sm:w-3.5 sm:h-3.5" fill="currentColor" />
                    </div>
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">You Said</span>
                    <div className="w-full p-2.5 sm:p-4 bg-white border border-pink-100 rounded-xl sm:rounded-2xl text-romantic-pink font-bold text-xs sm:text-sm text-center shadow-sm" dir="rtl">
                      {revealData.myAnswer}
                    </div>
                  </div>
                </motion.div>

                {/* Partner Answer */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center gap-2 sm:gap-4"
                >
                  <div className="relative">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white border-2 sm:border-4 border-white shadow-xl overflow-hidden ring-2 sm:ring-4 ring-romantic-lavender/10">
                      {partner?.avatar_url ? (
                        <img src={partner.avatar_url} alt="Partner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-romantic-lavender to-purple-400 text-white">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 sm:p-1 rounded-full shadow-md text-romantic-lavender border border-purple-50">
                      <Sparkles size={10} className="sm:w-3.5 sm:h-3.5" />
                    </div>
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{partnerName} Said</span>
                    <div className="w-full p-2.5 sm:p-4 bg-white border border-romantic-lavender/30 rounded-xl sm:rounded-2xl text-romantic-lavender font-bold text-xs sm:text-sm text-center shadow-sm" dir="rtl">
                      {revealData.partnerAnswer}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Auto-advance progress bar at bottom of card */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-full bg-romantic-pink"
                />
              </div>
              
              <div className="flex items-center justify-center gap-2 text-gray-400 text-[9px] font-black uppercase tracking-widest mt-2 overflow-hidden h-4">
                <Loader2 size={10} className="animate-spin" />
                <span>Next Question...</span>
              </div>
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
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-lg mt-6 grid grid-cols-2 gap-3 relative z-20"
      >
        <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-500 border-2 ${playerAnswer ? 'bg-white border-romantic-pink shadow-xl' : 'bg-white/40 border-white/50 border-dashed'}`}>
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-md overflow-hidden ${me?.avatar_url ? 'bg-white' : 'bg-gradient-to-br from-romantic-pink to-romantic-rose'}`}>
              {me?.avatar_url ? (
                <img src={me.avatar_url} alt="You" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-white" />
              )}
            </div>
            {playerAnswer && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-green-400 text-white p-0.5 rounded-full shadow-lg border-2 border-white"
              >
                <Check size={8} strokeWidth={4} />
              </motion.div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">You</p>
            <p className={`text-xs font-bold truncate ${playerAnswer ? 'text-gray-800' : 'text-gray-400'}`}>{playerAnswer ? 'Ready!' : 'Selecting...'}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-500 border-2 ${partnerAnswered ? 'bg-white border-romantic-lavender shadow-xl' : 'bg-white/40 border-white/50 border-dashed'}`}>
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-md overflow-hidden ${partner?.avatar_url ? 'bg-white' : 'bg-gradient-to-br from-romantic-lavender to-purple-400'}`}>
              {partner?.avatar_url ? (
                <img src={partner.avatar_url} alt="Partner" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-white" />
              )}
            </div>
            {partnerAnswered && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-green-400 text-white p-0.5 rounded-full shadow-lg border-2 border-white"
              >
                <Check size={8} strokeWidth={4} />
              </motion.div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 truncate">{partnerName}</p>
            <p className={`text-xs font-bold truncate ${partnerAnswered ? 'text-gray-800' : 'text-gray-400'}`}>{partnerAnswered ? 'Ready!' : 'Thinking...'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
