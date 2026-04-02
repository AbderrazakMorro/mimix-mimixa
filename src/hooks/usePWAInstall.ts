'use client';

import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    // Check if iOS Safari (where beforeinstallprompt is not supported)
    const ua = window.navigator.userAgent;
    const webkit = !!ua.match(/WebKit/i);
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isIOS = isIPad || isIPhone;
    const isSafari = isIOS && webkit && !ua.match(/CriOS/i);
    setIsIosSafari(isSafari);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // The app is installable automatically if we have a deferred prompt,
  // OR if we are on iOS Safari where we can show a tooltip instead.
  const isInstallable = !isStandalone && (!!deferredPrompt || isIosSafari);

  return {
    deferredPrompt,
    isStandalone,
    isIosSafari,
    isInstallable,
    handleInstallClick
  };
}
