'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';

type GlassCardProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
  strong?: boolean;
  noPadding?: boolean;
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, strong = false, noPadding = false, className = '', ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className={`
          rounded-[2rem]
          ${strong ? 'glass-strong' : 'glass'}
          ${noPadding ? '' : 'p-8 md:p-10'}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
export default GlassCard;
