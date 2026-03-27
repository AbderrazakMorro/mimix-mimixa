'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';
import { ProfileService } from '@/services/profileService';

export type UserProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

export type ProfileSettings = {
  theme: string;
  background_url: string | null;
  language: string;
  sound_enabled: boolean;
};

export type UserStats = {
  games_played: number;
  total_score: number;
  best_match_percentage: number;
};

type ProfileContextType = {
  profile: UserProfile | null;
  settings: ProfileSettings | null;
  stats: UserStats | null;
  loading: boolean;
  relationship: any | null;
  incomingInvites: any[];
  sentInvites: any[];
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: { display_name?: string; username?: string; bio?: string; avatar_url?: string; avatar_id?: string }) => Promise<boolean>;
  updateSettings: (updates: Partial<ProfileSettings>) => Promise<boolean>;
  playNotificationSound: () => void;
  pendingGameInvite: any | null;
  activeSentInvite: { invite: any; roomCode: string } | null;
  acceptGameInvite: (inviteId: string) => Promise<void>;
  declineGameInvite: (inviteId: string) => Promise<void>;
  sendGameInvite: (partnerId: string, settings?: any) => Promise<void>;
  cancelSentInvite: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [relationship, setRelationship] = useState<any | null>(null);
  const [incomingInvites, setIncomingInvites] = useState<any[]>([]);
  const [sentInvites, setSentInvites] = useState<any[]>([]);
  const [pendingGameInvite, setPendingGameInvite] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeSentInvite, setActiveSentInvite] = useState<{ invite: any, roomCode: string } | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await ProfileService.fetchProfileData();
      if (!data.profile) {
        setProfile(null);
        setSettings(null);
        setStats(null);
        setRelationship(null);
        setIncomingInvites([]);
        setSentInvites([]);
      } else {
        setProfile(data.profile);
        setSettings(data.settings);
        setStats(data.stats);
        setRelationship(data.relationship);
        setIncomingInvites(data.incomingInvites);
        setSentInvites(data.sentInvites);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
    const handle = () => refreshProfile();
    window.addEventListener('userUpdated', handle);
    return () => window.removeEventListener('userUpdated', handle);
  }, [refreshProfile]);

  // Sound Notification Logic
  const playNotificationSound = useCallback(() => {
    if (settings?.sound_enabled) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => { /* silent catch for browser autoplay rules */ });
    }
  }, [settings?.sound_enabled]);

  // Monitor incoming invites for changes
  const prevInvitesCount = React.useRef(0);
  useEffect(() => {
    if (incomingInvites.length > prevInvitesCount.current) {
      playNotificationSound();
    }
    prevInvitesCount.current = incomingInvites.length;
  }, [incomingInvites.length, playNotificationSound]);

  // Real-time Incoming Game Invite Listener
  useEffect(() => {
    if (!profile?.id) return;
    
    const unsubscribe = ProfileService.subscribeToGameInvites(
      profile.id,
      (invite) => {
        setPendingGameInvite(invite);
        playNotificationSound();
      },
      () => setPendingGameInvite(null)
    );

    return () => unsubscribe();
  }, [profile?.id, playNotificationSound]);

  // Real-time Sent Game Invite Listener (Waiting Room)
  useEffect(() => {
    if (!activeSentInvite) return;
    
    const unsubscribe = ProfileService.subscribeToSentInvite(
      activeSentInvite.invite.id,
      () => {
        playNotificationSound();
        setActiveSentInvite(null);
        window.location.href = `/room/${activeSentInvite.roomCode}`;
      },
      () => {
        setActiveSentInvite(null);
      }
    );

    return () => { unsubscribe(); };
  }, [activeSentInvite, playNotificationSound]);

  const sendGameInvite = async (partnerId: string, customSettings?: any) => {
    try {
      const data = await ProfileService.sendGameInvite(partnerId, customSettings);
      if (data?.invite && data?.roomCode) {
        setActiveSentInvite({ invite: data.invite, roomCode: data.roomCode });
      }
    } catch (err) {
      console.error('Failed to send game invite:', err);
    }
  };

  const acceptGameInvite = async (inviteId: string) => {
    try {
      const data = await ProfileService.respondToGameInvite(inviteId, 'accept');
      setPendingGameInvite(null);
      if (data?.roomCode) window.location.href = `/room/${data.roomCode}`;
    } catch (err) {
      console.error('Failed to accept game invite:', err);
    }
  };

  const declineGameInvite = async (inviteId: string) => {
    try {
      await ProfileService.respondToGameInvite(inviteId, 'decline');
      setPendingGameInvite(null);
    } catch (err) {
      console.error('Failed to decline game invite:', err);
    }
  };

  const cancelSentInvite = async () => {
    if (!activeSentInvite) return;
    try {
      await ProfileService.respondToGameInvite(activeSentInvite.invite.id, 'decline');
      setActiveSentInvite(null);
    } catch (err) {
      console.error('Failed to cancel game invite:', err);
    }
  };

  const updateProfile = async (updates: { display_name?: string; username?: string; bio?: string; avatar_url?: string; avatar_id?: string }) => {
    try {
      const data = await ProfileService.updateProfile(updates);
      setProfile((prev) => (prev ? { ...prev, ...data.profile } : data.profile));
      return true;
    } catch (err) {
      console.error('Failed to update profile:', err);
      return false;
    }
  };

  const updateSettings = async (updates: Partial<ProfileSettings>) => {
    try {
      const data = await ProfileService.updateSettings(updates);
      if (data.settings) {
        setSettings((prev) => (prev ? { ...prev, ...data.settings } : data.settings));
      }
      return true;
    } catch (err) {
      console.error('Failed to update settings:', err);
      return false;
    }
  };

  return (
    <ProfileContext.Provider value={{ 
      profile, 
      settings, 
      stats, 
      loading, 
      relationship, 
      incomingInvites, 
      sentInvites, 
      refreshProfile, 
      updateProfile, 
      updateSettings,
      playNotificationSound,
      pendingGameInvite,
      activeSentInvite,
      acceptGameInvite,
      declineGameInvite,
      sendGameInvite,
      cancelSentInvite
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
