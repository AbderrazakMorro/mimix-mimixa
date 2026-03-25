'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type BackgroundContextType = {
  backgroundUrl: string | null;
  setBackgroundUrl: (url: string | null) => void;
};

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial background from me endpoint
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.background_url) {
            setBackgroundUrl(data.user.background_url);
          }
        }
      } catch (err) {
        console.error('Failed to fetch background');
      }
    };
    fetchUser();
  }, []);

  return (
    <BackgroundContext.Provider value={{ backgroundUrl, setBackgroundUrl }}>
      <div className="relative min-h-screen">
        {backgroundUrl && (
          <div
            className="fixed inset-0 z-[-1] transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.15, // Subtle overlay so text remains readable
            }}
          />
        )}
        {children}
      </div>
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
