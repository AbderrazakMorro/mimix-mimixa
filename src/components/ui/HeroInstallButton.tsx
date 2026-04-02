'use client';

import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function HeroInstallButton() {
  const { isInstallable, isIosSafari, showFallback, handleInstallClick } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center mb-6 sm:mb-10 w-full"
      >
        {isIosSafari || showFallback ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#E8677D]/20 shadow-md text-center">
             <span className="text-xs sm:text-sm font-semibold text-[#8B3F5A] mb-1">Install Mimixa App</span>
             {isIosSafari ? (
               <span className="text-[10px] sm:text-xs text-[#A06070]">Tap "Share" <span className="inline-block border border-current rounded px-1 mx-0.5">↑</span> then "Add to Home Screen"</span>
             ) : (
               <span className="text-[10px] sm:text-xs text-[#A06070]">Tap your browser menu (⋮) and select "Install App"</span>
             )}
          </motion.div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#E8677D] text-white font-bold tracking-wide shadow-lg shadow-[#E8677D]/30 hover:shadow-xl hover:bg-[#D4576A] hover:scale-105 active:scale-95 transition-all text-sm sm:text-base ring-2 ring-white/50"
          >
            <Download size={18} />
            <span>Install App</span>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
