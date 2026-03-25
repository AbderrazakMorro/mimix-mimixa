import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type OnlineStatus = 'online' | 'offline';

export function usePresence(userId: string | undefined, currentUserId: string | undefined) {
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('offline');
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userId || !currentUserId) return;

    // Track presence in a global channel
    const channel = supabase.channel('global_presence', {
      config: {
        presence: { key: currentUserId },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        // Check if the target user is in the presence state
        const isOnline = Object.keys(newState).includes(userId);
        setOnlineStatus(isOnline ? 'online' : 'offline');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === userId) {
          setOnlineStatus('online');
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key === userId) {
          setOnlineStatus('offline');
          // Actually, we could also fetch their last_seen from DB here if needed
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, currentUserId, supabase]);

  // Fetch initial last_seen if offline
  useEffect(() => {
    if (!userId) return;
    const fetchLastSeen = async () => {
      const { data } = await supabase
        .from('users')
        .select('last_seen')
        .eq('id', userId)
        .single();
      
      if (data?.last_seen) {
        setLastSeen(data.last_seen);
      }
    };
    fetchLastSeen();
  }, [userId, supabase]);

  // Optionally update current user's last_seen when unmounting / navigating away
  useEffect(() => {
    const updateLastSeen = () => {
      if (currentUserId) {
         // Using navigator.sendBeacon or a quick fetch could be better for unmount, 
         // but a realtime channel disconnect is usually sufficient if we update last_seen via a postgres trigger or logic.
         // For simplicity, we just rely on presence state.
      }
    };
    window.addEventListener('beforeunload', updateLastSeen);
    return () => window.removeEventListener('beforeunload', updateLastSeen);
  }, [currentUserId]);

  return { onlineStatus, lastSeen };
}
