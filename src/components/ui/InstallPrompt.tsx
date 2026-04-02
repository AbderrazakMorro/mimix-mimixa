'use client';

import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function InstallPrompt() {
  const { isInstallable, showFallback, handleInstallClick } = usePWAInstall();

  return (
    <AnimatePresence>
      {isInstallable && (
        <motion.div className="relative flex items-center">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8677D]/10 text-[#E8677D] border border-[#E8677D]/20 text-[11px] md:text-xs font-bold uppercase tracking-wider hover:bg-[#E8677D]/20 transition-all shadow-sm"
            title="Install App"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Install App</span>
          </motion.button>
          
          {showFallback && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#E8677D]/20 shadow-xl rounded-xl p-3 text-center z-50 origin-top-right"
            >
              <span className="text-[10px] sm:text-xs text-[#A06070] font-medium leading-tight">
                Tap your browser menu (⋮) and select "Install App" or "Add to Home Screen"
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
