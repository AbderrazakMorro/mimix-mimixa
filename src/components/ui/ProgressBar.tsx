'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'primary' | 'secondary' | 'gold';
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  color = 'primary'
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colors = {
    primary: 'bg-gradient-to-r from-primary-300 to-primary-500',
    secondary: 'bg-gradient-to-r from-secondary-300 to-secondary-500',
    gold: 'bg-gradient-to-r from-accent-gold to-[#FFB703]',
  };

  return (
    <div className="w-full space-y-2">
      {(label || showValue) && (
        <div className="flex justify-between items-end px-2">
          {label && (
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-xs font-bold text-primary-600">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="h-3 w-full bg-primary-50 rounded-full p-1 overflow-hidden border border-primary-100/50 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full shadow-sm ${colors[color]}`}
        />
      </div>
    </div>
  );
}
