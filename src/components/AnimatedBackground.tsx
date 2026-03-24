'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

type Motif = 'hearts' | 'butterflies' | 'tulips';
type Intensity = 'low' | 'medium' | 'high';

type AnimatedBackgroundProps = {
  motif?: Motif;
  intensity?: Intensity;
  enabled?: boolean;
};

const intensityCount: Record<Intensity, number> = {
  low: 6,
  medium: 12,
  high: 20,
};

/* ────── SVG Motifs ────── */

const HeartSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const ButterflySVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 16c-6-12-20-14-24-6s4 18 16 22c-4 8-2 18 4 22 2-6 4-14 4-22 0 8 2 16 4 22 6-4 8-14 4-22 12-4 20-14 16-22s-18-6-24 6z" opacity="0.85" />
  </svg>
);

const TulipSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 28c-4-12-14-20-18-16s2 14 10 20L14 60h20L32 32c8-6 14-16 10-20s-14 4-18 16z" opacity="0.8" />
    <ellipse cx="24" cy="10" rx="8" ry="10" opacity="0.9" />
  </svg>
);

const motifComponents: Record<Motif, React.FC<{ size: number }>> = {
  hearts: HeartSVG,
  butterflies: ButterflySVG,
  tulips: TulipSVG,
};

const motifColors: Record<Motif, string[]> = {
  hearts: ['text-romantic-pink/25', 'text-romantic-rose/20', 'text-romantic-lavender/20'],
  butterflies: ['text-romantic-lavender/25', 'text-romantic-peach/20', 'text-romantic-pink/15'],
  tulips: ['text-romantic-pink/20', 'text-romantic-rose/15', 'text-romantic-peach/20'],
};

export default function AnimatedBackground({
  motif = 'hearts',
  intensity = 'medium',
  enabled = true,
}: AnimatedBackgroundProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const count = isMobile
    ? Math.max(3, Math.floor(intensityCount[intensity] / 2))
    : intensityCount[intensity];

  const MotifComponent = motifComponents[motif];
  const colors = motifColors[motif];

  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: Math.random() * 18 + 12,
      left: Math.random() * 100,
      delay: Math.random() * 6,
      duration: Math.random() * 12 + 10,
      endX: Math.random() * 80 - 40,
      rot: Math.random() * 360,
      color: colors[i % colors.length],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, motif]);

  if (!isMounted || !enabled) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => {
        // Butterflies get curved motion, tulips get parallax sway, hearts go straight up
        const yAnimation: any = motif === 'tulips' ? [0, -8, 0, -6, 0] : '-110vh';
        const xAnimation: any =
          motif === 'butterflies'
            ? [0, p.endX * 0.5, -p.endX * 0.3, p.endX, p.endX * 0.7]
            : motif === 'tulips'
            ? [0, p.endX * 0.3, -p.endX * 0.3, 0]
            : p.endX;

        const durationActual =
          motif === 'tulips' ? p.duration * 0.6 : p.duration;

        return (
          <motion.div
            key={p.id}
            className={`absolute ${motif === 'tulips' ? '' : 'bottom-[-10%]'} ${p.color} drop-shadow-sm`}
            style={{
              left: `${p.left}%`,
              ...(motif === 'tulips' ? { top: `${20 + Math.random() * 60}%` } : {}),
              willChange: 'transform, opacity',
            }}
            initial={{ y: 0, x: 0, opacity: 0, scale: 0 }}
            animate={{
              y: yAnimation,
              x: xAnimation,
              opacity: motif === 'tulips' ? [0, 0.7, 0.7, 0.5, 0.7] : [0, 0.7, 0.7, 0],
              scale: [0, 1, 1.1, motif === 'tulips' ? 1 : 0.8],
              rotate: motif === 'butterflies' ? [0, 15, -10, 20, 0] : p.rot,
            }}
            transition={{
              duration: durationActual,
              delay: p.delay,
              repeat: Infinity,
              ease: motif === 'butterflies' ? 'easeInOut' : 'linear',
            }}
          >
            <MotifComponent size={p.size} />
          </motion.div>
        );
      })}

      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-romantic-lavender/15 via-transparent to-romantic-peach/15 opacity-60 blur-3xl mix-blend-overlay pointer-events-none" />
    </div>
  );
}
