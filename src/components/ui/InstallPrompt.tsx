'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <AnimatePresence>
      {!isStandalone && deferredPrompt && (
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
      )}
    </AnimatePresence>
  );
}
