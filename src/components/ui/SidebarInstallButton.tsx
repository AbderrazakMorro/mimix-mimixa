'use client';

import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function SidebarInstallButton() {
  const { isInstallable, isIosSafari, showFallback, handleInstallClick } = usePWAInstall();

  if (!isInstallable) return null;

  if (isIosSafari || showFallback) {
    return (
      <div className="flex flex-col items-center bg-white/60 px-3 py-2.5 rounded-2xl border border-[#E8677D]/20 shadow-sm text-center">
        <span className="text-[11px] font-semibold text-[#8B3F5A] mb-0.5">Install App</span>
        {isIosSafari ? (
          <span className="text-[9px] text-[#A06070] leading-tight">Tap Share <span className="inline-block border border-current rounded px-0.5">↑</span> then "Add Home Screen"</span>
        ) : (
          <span className="text-[9px] text-[#A06070] leading-tight">Tap browser menu (⋮) &rarr; Install App</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#E8677D] text-sm font-bold shadow-sm border border-[#E8677D]/20 hover:bg-[#E8677D]/5 hover:scale-[1.02] active:scale-[0.98] transition-all"
      aria-label="Install App"
    >
      <Download size={16} />
      <span>Install App</span>
    </button>
  );
}
