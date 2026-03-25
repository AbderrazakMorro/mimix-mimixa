'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FloatingMotifProps {
  type: 'heart' | 'sparkle' | 'circle';
}

const FloatingMotif = ({ type }: FloatingMotifProps) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [duration, setDuration] = useState(0);
  const [delay, setDelay] = useState(0);

  useEffect(() => {
    setCoords({
      x: Math.random() * 100,
      y: Math.random() * 100
    });
    setDuration(15 + Math.random() * 20);
    setDelay(Math.random() * 10);
  }, []);

  const icons = {
    heart: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    sparkle: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    circle: <div className="w-full h-full rounded-full" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        y: ['0vh', '100vh'],
        x: [`${coords.x - 5}%`, `${coords.x + 5}%`, `${coords.x - 5}%`],
        opacity: [0, 0.4, 0.4, 0],
        scale: [0.5, 1, 1, 0.5],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: 'linear',
        delay: delay,
      }}
      className="absolute text-primary-200/20 pointer-events-none"
      style={{
        left: `${coords.x}%`,
        top: '-10%',
        width: `${10 + Math.random() * 20}px`,
        height: `${10 + Math.random() * 20}px`,
      }}
    >
      {icons[type]}
    </motion.div>
  );
};

export default function AnimatedBackground() {
  const motifs: FloatingMotifProps['type'][] = ['heart', 'sparkle', 'heart', 'circle', 'heart', 'circle', 'sparkle', 'heart'];

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      {/* Base Gradients */}
      <div className="absolute inset-0 bg-[#FFF5F7]" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-50 via-transparent to-secondary-50 opacity-60" />
      
      {/* Animated Mesh Gradients */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-1/4 -left-1/4 w-full h-full bg-rose-100/40 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-lavender-100/40 rounded-full blur-[120px]"
      />

      {/* Floating Elements */}
      {motifs.map((type, i) => (
        <FloatingMotif key={i} type={type} />
      ))}
      {motifs.map((type, i) => (
        <FloatingMotif key={`extra-${i}`} type={type === 'heart' ? 'sparkle' : 'heart'} />
      ))}

      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }} />
    </div>
  );
}
