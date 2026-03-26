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
        initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-lg glass-strong rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8"
        dir="rtl"
      >
        <h2 className="text-heading-md font-serif font-bold text-gray-800 mb-6 sm:mb-8 leading-relaxed text-center drop-shadow-sm px-2">
          {question.question_text}
        </h2>
        
        <div className="grid gap-3 md:gap-4">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isWaiting = selectedAnswer && !partnerAnswered;
            
            return (
              <motion.button
                key={option}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                whileHover={!selectedAnswer ? { scale: 1.02, backgroundColor: "rgba(255,107,138,0.05)" } : {}}
                whileTap={!selectedAnswer ? { scale: 0.98 } : {}}
                onClick={() => !selectedAnswer && onAnswer(option)}
                disabled={selectedAnswer !== null}
                className={`
                  p-4 md:p-5 rounded-2xl text-base md:text-lg font-medium transition-all duration-300 border-2 text-right relative overflow-hidden
                  ${isSelected
                    ? "border-romantic-pink bg-pink-50 text-romantic-pink shadow-md glow-pink"
                    : "border-gray-100 bg-white/80 text-gray-700 hover:border-pink-200"
                  }
                  ${selectedAnswer && !isSelected ? "opacity-40 scale-[0.97]" : ""}
                `}
              >
                <div className="flex items-center gap-3 md:gap-4 relative z-10">
                  <div className={`
                    w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all flex-shrink-0
                    ${isSelected ? "bg-gradient-to-br from-romantic-pink to-romantic-rose text-white shadow-inner" : "bg-gray-50 text-gray-400 border border-gray-100"}
                  `}>
                    {idx + 1}
                  </div>
                  <span className="leading-snug">{option}</span>
                </div>
                
                {/* Progress bar effect while waiting for partner */}
                {isSelected && isWaiting && (
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-romantic-pink to-romantic-peach w-full opacity-60"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {selectedAnswer && !partnerAnswered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex items-center justify-center gap-2 mt-8 text-romantic-pink font-medium"
          >
            <Heart size={18} className="animate-pulse" fill="currentColor" />
            <span className="animate-pulse">ننتظر إجابة شريكك...</span>
          </motion.div>
        )}

        {selectedAnswer && partnerAnswered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mt-8 p-5 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl text-center text-romantic-pink font-bold shadow-inner flex items-center justify-center gap-2"
          >
            <Sparkles size={20} className="text-romantic-gold" />
            تم الإجابة! الانتقال للسؤال التالي...
          </motion.div>
        )}

      </motion.div>
    </AnimatePresence>
  );
}

export default memo(QuestionCard);
