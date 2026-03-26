import { createClient } from '@/lib/supabase/client';
import { UserProfile, ProfileSettings, UserStats } from '@/contexts/ProfileContext';

export const ProfileService = {
  async fetchProfileData() {
    const [profileRes, relationRes] = await Promise.all([
      fetch('/api/profile/me'),
      fetch('/api/relationships/me')
    ]);

    let dataToReturn = {
      profile: null as UserProfile | null,
      settings: null as ProfileSettings | null,
      stats: null as UserStats | null,
      relationship: null as any | null,
      incomingInvites: [] as any[],
      sentInvites: [] as any[]
    };

    if (profileRes.ok) {
      const data = await profileRes.json();
      dataToReturn.profile = data.profile;
      dataToReturn.settings = data.settings;
      dataToReturn.stats = data.stats;
    }

    if (relationRes.ok) {
      const relData = await relationRes.json();
      const relationships = relData.relationships || [];
      dataToReturn.relationship = relationships.find((r: any) => r.status === 'accepted') || null;
      dataToReturn.incomingInvites = relationships.filter((r: any) => r.status === 'pending' && !r.isInviter);
      dataToReturn.sentInvites = relationships.filter((r: any) => r.status === 'pending' && r.isInviter);
    }

    return dataToReturn;
  },

  async updateProfile(updates: Partial<UserProfile> & { avatar_id?: string }) {
    const res = await fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return await res.json();
  },

  async updateSettings(updates: Partial<ProfileSettings>) {
    const res = await fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: updates }),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return await res.json();
  },

  async sendGameInvite(partnerId: string, settings?: any) {
    const res = await fetch('/api/game/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: partnerId, settings })
    });
    if (!res.ok) throw new Error('Failed to send game invite');
    return await res.json();
  },

  async respondToGameInvite(inviteId: string, action: 'accept' | 'decline') {
    const res = await fetch('/api/game/invite/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: inviteId, action })
    });
    if (!res.ok) throw new Error(`Failed to ${action} game invite`);
    if (action === 'accept') {
       return await res.json();
    }
  },

  async fetchUserBasicProfile(userId: string) {
    const res = await fetch(`/api/profile?id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return await res.json();
  },

  subscribeToGameInvites(profileId: string, onInvitePending: (invite: any) => void, onInviteRemoved: () => void) {
    const supabase = createClient();
    const channel = supabase
      .channel(`game-invites-${profileId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_invites', filter: `receiver_id=eq.${profileId}` },
        async (payload: any) => {
          const invite = payload.new as any;
          if (invite.status === 'pending') {
            try {
              const data = await this.fetchUserBasicProfile(invite.sender_id);
              onInvitePending({ ...invite, sender: data.user });
            } catch (err) {
              console.error(err);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_invites', filter: `receiver_id=eq.${profileId}` },
        (payload: any) => {
          if (payload.new.status !== 'pending') onInviteRemoved();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'game_invites', filter: `receiver_id=eq.${profileId}` },
        () => onInviteRemoved()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToSentInvite(inviteId: string, onAccepted: () => void, onDeclined: () => void) {
    const supabase = createClient();
    const channel = supabase
      .channel(`sent-invite-${inviteId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_invites', filter: `id=eq.${inviteId}` },
        (payload: any) => {
          if (payload.new.status === 'accepted') onAccepted();
          else if (payload.new.status === 'ignored') onDeclined();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'game_invites', filter: `id=eq.${inviteId}` },
        () => onDeclined()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }
};
