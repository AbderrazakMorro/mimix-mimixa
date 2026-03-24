'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

export default function FloatingHearts() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const heartsData = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      size: Math.random() * 20 + 10,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
      endX: Math.random() * 100 - 50,
      rot: Math.random() * 360,
    }));
  }, []);

  if (!isMounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {heartsData.map((data, i) => (
        <motion.div
          key={i}
          className="absolute bottom-[-10%] text-romantic-pink/30 drop-shadow-sm"
          initial={{ y: 0, x: 0, opacity: 0, scale: 0 }}
          animate={{
            y: '-110vh',
            x: data.endX,
            opacity: [0, 0.8, 0.8, 0],
            scale: [0, 1, 1.2, 0.8],
            rotate: data.rot
          }}
          transition={{
            duration: data.duration,
            delay: data.delay,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ left: `${data.left}%` }}
        >
          <Heart size={data.size} fill="currentColor" />
        </motion.div>
      ))}
      
      {/* Light animated gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-romantic-lavender/20 via-transparent to-romantic-peach/20 opacity-50 blur-3xl mix-blend-overlay pointer-events-none"></div>
    </div>
  );
}
