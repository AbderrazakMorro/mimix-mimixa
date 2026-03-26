import { createClient } from '@/lib/supabase/client';
import { GameSession, SessionPlayer, AnswerRecord } from '@/hooks/useGameSession';

export const GameService = {
  async fetchSession(roomCode: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (error || !data) {
      throw new Error('Session not found');
    }
    return data as GameSession;
  },

  async fetchPlayers(sessionId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from('session_players')
      .select('*, profiles(display_name, avatar_url, username)')
      .eq('session_id', sessionId);
    return (data || []) as SessionPlayer[];
  },

  async fetchAnswersForQuestion(sessionId: string, questionId: number) {
    const supabase = createClient();
    const { data } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('question_id', questionId);
    return (data || []) as AnswerRecord[];
  },

  async submitAnswer(sessionId: string, questionIndex: number, selectedOption: string) {
    const res = await fetch('/api/game/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionIndex, selectedOption }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit answer');
    return data as {
      bothAnswered: boolean;
      partnerAnswer?: string;
      isMatch?: boolean;
      isGameOver?: boolean;
    };
  },

  async startGame(sessionId: string, settings?: { questionCount?: number; includeAdult?: boolean }) {
    const res = await fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...settings }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start game');
    return data;
  },

  // State Flow Control: Subscriptions
  subscribeToSessionState(roomCode: string, onUpdate: (payload: any) => void) {
    const supabase = createClient();
    const channel = supabase
      .channel(`game-session-${roomCode}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `room_code=eq.${roomCode}` },
        onUpdate
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  subscribeToSessionPlayers(onInsert: (payload: any) => void) {
    const supabase = createClient();
    const channel = supabase
      .channel(`game-players`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_players' },
        onInsert
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  subscribeToAnswers(onInsert: (payload: any) => void) {
    const supabase = createClient();
    const channel = supabase
      .channel(`game-answers`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers' },
        onInsert
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
};
