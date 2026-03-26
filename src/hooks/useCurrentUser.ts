'use client';

import { useState, useEffect } from 'react';

export type CurrentUser = {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  background_url: string | null;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();

    // Listen for profile updates
    const handle = () => fetchUser();
    window.addEventListener('userUpdated', handle);
    return () => window.removeEventListener('userUpdated', handle);
  }, []);

  return { user, loading };
}
