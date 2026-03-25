'use client';

import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export default function Avatar({
  src,
  alt = 'Avatar',
  size = 'md',
  className,
  glow = true
}: AvatarProps) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <motion.div
      whileHover={glow ? { scale: 1.05 } : {}}
      className={cn(
        'relative rounded-full p-1 bg-gradient-to-br from-primary-200 via-accent-lavender to-primary-100 shadow-sm',
        glow && 'avatar-glow',
        sizes[size],
        className
      )}
    >
      <div className="w-full h-full rounded-full bg-white overflow-hidden border-2 border-white shadow-inner flex items-center justify-center">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-white font-bold text-lg">
            {alt[0]?.toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Decorative ornament */}
      {glow && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1 -right-1 w-4 h-4 text-primary-400 opacity-60"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
