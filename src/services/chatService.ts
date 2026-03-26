import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Global cache for realtime channels and subscriber arrays
const activeChannels: Record<string, RealtimeChannel> = {};
const channelSubscribers: Record<string, number> = {};

const messageListeners: Record<string, ((payload: any) => void)[]> = {};
const reactionListeners: Record<string, (() => void)[]> = {};
const typingListeners: Record<string, ((payload: any) => void)[]> = {};

// Keep track of cleanup timers to cancel them if a subscriber rejoins quickly
const cleanupTimers: Record<string, NodeJS.Timeout> = {};

export const ChatService = {
  async fetchConversations() {
    const res = await fetch('/api/chat/conversations');
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return await res.json();
  },

  async createPrivateConversation(partnerId: string) {
    const res = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'private', partner_id: partnerId })
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return await res.json();
  },

  async fetchMessages(conversationId: string) {
    const res = await fetch(`/api/chat/messages?conversation_id=${conversationId}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return await res.json();
  },

  async sendMessage(conversationId: string, content: string, type: 'text' | 'sticker' | 'emoji' = 'text', metadata: any = {}) {
    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, content, message_type: type, metadata })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return await res.json();
  },

  async toggleReaction(messageId: string, reaction: string) {
    const res = await fetch('/api/chat/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, reaction })
    });
    if (!res.ok) throw new Error('Failed to toggle reaction');
    return await res.json();
  },

  async markAsSeen(conversationId: string) {
    const res = await fetch('/api/chat/seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId })
    });
    if (!res.ok) throw new Error('Failed to mark as seen');
    return await res.json();
  },

  subscribeToConversation(conversationId: string, onMessageInsert: (payload: any) => void, onReactionChange: () => void, onTyping: (payload: any) => void) {
    const supabase = createClient();
    const channelName = `chat:${conversationId}`;
    
    // Clear any pending cleanup if we are re-subscribing quickly
    if (cleanupTimers[channelName]) {
      clearTimeout(cleanupTimers[channelName]);
      delete cleanupTimers[channelName];
    }

    // Initialize callback arrays if they don't exist
    if (!messageListeners[channelName]) messageListeners[channelName] = [];
    if (!reactionListeners[channelName]) reactionListeners[channelName] = [];
    if (!typingListeners[channelName]) typingListeners[channelName] = [];

    // Add current caller's callbacks to the arrays
    messageListeners[channelName].push(onMessageInsert);
    reactionListeners[channelName].push(onReactionChange);
    typingListeners[channelName].push(onTyping);

    // Create channel if it doesn't exist globally
    if (!activeChannels[channelName]) {
      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } }
      });

      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          messageListeners[channelName]?.forEach(cb => cb(payload));
        }
      );

      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        () => {
          reactionListeners[channelName]?.forEach(cb => cb());
        }
      );

      channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        typingListeners[channelName]?.forEach(cb => cb(payload));
      });

      activeChannels[channelName] = channel;
      channelSubscribers[channelName] = 0;
      
      // Subscribe exactly once upon creation
      channel.subscribe();
    }

    const channel = activeChannels[channelName];
    channelSubscribers[channelName]++;

    return () => {
      // Remove specific caller's callbacks
      messageListeners[channelName] = messageListeners[channelName]?.filter(cb => cb !== onMessageInsert) || [];
      reactionListeners[channelName] = reactionListeners[channelName]?.filter(cb => cb !== onReactionChange) || [];
      typingListeners[channelName] = typingListeners[channelName]?.filter(cb => cb !== onTyping) || [];

      channelSubscribers[channelName]--;
      
      if (channelSubscribers[channelName] <= 0) {
        // Delay complete destruction by 2 seconds to survive React StrictMode or brief navigations
        cleanupTimers[channelName] = setTimeout(() => {
          if (channelSubscribers[channelName] <= 0) {
            supabase.removeChannel(activeChannels[channelName]);
            delete activeChannels[channelName];
            delete channelSubscribers[channelName];
            delete messageListeners[channelName];
            delete reactionListeners[channelName];
            delete typingListeners[channelName];
            delete cleanupTimers[channelName];
          }
        }, 2000);
      }
    };
  },

  sendTypingBroadcast(conversationId: string, userId: string, typing: boolean) {
    const channelName = `chat:${conversationId}`;
    const channel = activeChannels[channelName];
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, typing }
      });
    } else {
      const supabase = createClient();
      supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, typing }
      });
    }
  }
};
