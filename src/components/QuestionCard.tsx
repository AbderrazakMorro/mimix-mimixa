'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

type Question = {
  id: number;
  question_text: string;
  options: string[];
};

type Props = {
  question: Question;
  onAnswer: (option: string) => void;
  selectedAnswer: string | null;
  partnerAnswered: boolean;
};

import React, { memo } from 'react';

function QuestionCard({ question, onAnswer, selectedAnswer, partnerAnswered }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-xl glass-strong rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 md:p-12 shadow-3xl border border-white/60 relative flex flex-col justify-center min-h-0"
        dir="rtl"
      >
        {/* Question Header */}
        <div className="flex justify-center mb-4 sm:mb-8">
          <div className="bg-romantic-pink/5 px-4 py-1.5 rounded-full border border-romantic-pink/20 flex items-center gap-2">
            <Sparkles size={12} className="text-romantic-gold" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-romantic-pink">The Question</span>
            <Sparkles size={12} className="text-romantic-gold" />
          </div>
        </div>

        <h2 className="text-lg sm:text-2xl font-serif font-black text-gray-800 mb-6 sm:mb-10 leading-tight text-center drop-shadow-sm px-2">
          {question.question_text}
        </h2>
        
        <div className="flex flex-col gap-3 sm:gap-4 w-full">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isWaiting = selectedAnswer && !partnerAnswered;
            
            return (
              <motion.button
                key={option}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={!selectedAnswer ? { scale: 1.01, x: -3 } : {}}
                whileTap={!selectedAnswer ? { scale: 0.99 } : {}}
                onClick={() => !selectedAnswer && onAnswer(option)}
                disabled={selectedAnswer !== null}
                className={`
                  p-3.5 sm:p-5 rounded-[1.25rem] sm:rounded-2xl text-sm sm:text-base font-bold transition-all duration-500 border-2 text-right relative overflow-hidden group flex-shrink-0 w-full
                  ${isSelected
                    ? "border-romantic-pink bg-white text-romantic-pink shadow-xl ring-4 ring-romantic-pink/5"
                    : "border-gray-100 bg-white/60 text-gray-700 hover:border-romantic-pink/40 hover:bg-white/90"
                  }
                  ${selectedAnswer && !isSelected ? "opacity-30 scale-[0.98] grayscale-[0.2]" : ""}
                `}
              >
                <div className="flex items-center gap-3 sm:gap-6 relative z-10">
                  <div className={`
                    w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-[10px] sm:text-base transition-all duration-500 flex-shrink-0
                    ${isSelected 
                      ? "bg-gradient-to-br from-romantic-pink to-romantic-rose text-white shadow-lg rotate-3" 
                      : "bg-gray-100 text-gray-400 group-hover:bg-pink-50 group-hover:text-romantic-pink group-hover:rotate-1"
                    }
                  `}>
                    {idx + 1}
                  </div>
                  <span className="leading-tight flex-1 line-clamp-2">{option}</span>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-romantic-pink">
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
                    </motion.div>
                  )}
                </div>
                
                {/* Visual feedback while waiting */}
                {isSelected && isWaiting && (
                  <>
                    <motion.div 
                      initial={{ left: "100%" }}
                      animate={{ left: "-100%" }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute bottom-0 h-1 bg-gradient-to-r from-transparent via-romantic-pink to-transparent w-full opacity-40"
                    />
                    <div className="absolute inset-0 bg-pink-50/10 pointer-events-none" />
                  </>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {selectedAnswer && !partnerAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col items-center justify-center gap-2 mt-6 sm:mt-12 mb-1 p-4 sm:p-6 bg-white/40 rounded-2xl sm:rounded-3xl border border-white/60"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <Heart size={18} className="text-romantic-pink animate-pulse" fill="currentColor" />
                  <Sparkles size={10} className="absolute -top-1 -right-1 text-romantic-gold animate-bounce" />
                </div>
                <span className="text-romantic-pink font-black text-[10px] sm:text-sm uppercase tracking-widest animate-pulse">Waiting for partner...</span>
              </div>
            </motion.div>
          )}

          {selectedAnswer && partnerAnswered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              className="mt-6 sm:mt-12 p-4 sm:p-6 bg-gradient-to-br from-romantic-pink to-romantic-rose rounded-2xl sm:rounded-3xl text-center text-white font-black shadow-2xl flex items-center justify-center gap-3 border-b-2 sm:border-b-4 border-rose-600"
            >
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <Sparkles className="text-romantic-gold w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col items-start gap-0.5 sm:gap-1">
                <span className="text-[8px] sm:text-xs uppercase tracking-[0.2em] opacity-80 leading-none">Complete!</span>
                <span className="text-sm sm:text-lg leading-none">Revealing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
}



export default memo(QuestionCard);
