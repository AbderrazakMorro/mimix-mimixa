'use client';

import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-black uppercase tracking-widest text-primary-400 ml-4">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300 group-focus-within:text-primary-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full bg-white/50 backdrop-blur-md border-2 border-primary-100 rounded-full py-3.5 transition-all duration-300 outline-none',
            'focus:border-primary-400 focus:bg-white focus:shadow-romantic-lg',
            'placeholder:text-primary-200 text-primary-900',
            icon ? 'pl-12 pr-6' : 'px-6',
            error ? 'border-red-300 focus:border-red-400' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-red-500 text-[10px] font-bold ml-4"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
