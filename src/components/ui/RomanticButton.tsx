'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

type RomanticButtonProps = HTMLMotionProps<'button'> & {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
};

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-romantic-pink to-romantic-rose text-white shadow-md glow-pink',
  secondary:
    'bg-white/70 text-romantic-pink border-2 border-romantic-pink/20 shadow-sm hover:border-romantic-pink/50',
  ghost:
    'bg-transparent text-gray-500 hover:text-romantic-pink',
};

const RomanticButton = forwardRef<HTMLButtonElement, RomanticButtonProps>(
  ({ variant = 'primary', loading = false, fullWidth = false, children, className = '', disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={!disabled ? { scale: 1.02, boxShadow: '0 8px 24px -6px rgba(255,107,138,0.35)' } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        disabled={disabled || loading}
        className={`
          font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2
          disabled:opacity-60 disabled:cursor-not-allowed
          ${fullWidth ? 'w-full' : ''}
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

RomanticButton.displayName = 'RomanticButton';
export default RomanticButton;
