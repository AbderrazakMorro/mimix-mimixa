'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameService } from '@/services/gameService';

export type GameSession = {
  id: string;
  room_code: string;
  host_id: string;
  player2_id: string | null;
  status: 'waiting' | 'in_progress' | 'completed';
  question_count: number;
  current_question_index: number;
  include_adult: boolean;
  round: number;
  settings: Record<string, unknown>;
};

export type SessionPlayer = {
  session_id: string;
  player_id: string;
  joined_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
};

export type AnswerRecord = {
  id: string;
  session_id: string;
  player_id: string;
  question_id: number;
  selected_option: string;
  answered_at: string;
};

type UseGameSessionOptions = {
  roomCode: string;
  userId: string;
};

export function useGameSession({ roomCode, userId }: UseGameSessionOptions) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Answers for the current question
  const [currentAnswers, setCurrentAnswers] = useState<AnswerRecord[]>([]);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);

  const isHost = session?.host_id === userId;
  const playerCount = players.length;
  const bothPlayersPresent = playerCount >= 2 || !!session?.player2_id;

  // Fetch initial session data
  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await GameService.fetchSession(roomCode);
      setSession(data);
      sessionIdRef.current = data.id;

      // Fetch players with profiles
      const playersData = await GameService.fetchPlayers(data.id);
      setPlayers(playersData);

      // Fetch current question answers
      const answersData = await GameService.fetchAnswersForQuestion(data.id, data.current_question_index);
      if (answersData) {
        setCurrentAnswers(answersData);
        const partner = answersData.find((a: AnswerRecord) => a.player_id !== userId);
        if (partner) {
          setPartnerAnswered(true);
          setPartnerAnswer(partner.selected_option);
        }
      }
    } catch (err) {
      setError('Session not found');
    } finally {
      setLoading(false);
    }
  }, [roomCode, userId]);

  // Set up Realtime subscriptions
  useEffect(() => {
    fetchSession();

    const unsubSession = GameService.subscribeToSessionState(roomCode, async (payload) => {
      const updated = payload.new as GameSession;
      setSession((prev) => {
        if (!prev) return updated;
        // If player2 just joined, re-fetch players to get their profile
        if (updated.player2_id && !prev.player2_id && sessionIdRef.current) {
          GameService.fetchPlayers(sessionIdRef.current).then(setPlayers);
        }
        if (updated.current_question_index !== prev.current_question_index) {
          setCurrentAnswers([]);
          setPartnerAnswered(false);
          setPartnerAnswer(null);
        }
        return updated;
      });
    });

    const unsubPlayers = GameService.subscribeToSessionPlayers(async (payload) => {
      const newPlayer = payload.new as any;
      if (sessionIdRef.current && newPlayer.session_id !== sessionIdRef.current) return;

      // When a player joins, we might need to fetch their profile
      // For simplicity, re-fetching players entirely ensures we get the latest profiles
      if (sessionIdRef.current) {
        const playersData = await GameService.fetchPlayers(sessionIdRef.current);
        setPlayers(playersData);
      }
    });

    const unsubAnswers = GameService.subscribeToAnswers((payload) => {
      const answer = payload.new as AnswerRecord;
      if (sessionIdRef.current && answer.session_id !== sessionIdRef.current) return;

      setCurrentAnswers((prev) => {
        if (prev.some((a) => a.id === answer.id)) return prev;
        return [...prev, answer];
      });

      setSession((prevSession) => {
        if (answer.player_id !== userId && answer.question_id === prevSession?.current_question_index) {
          setPartnerAnswered(true);
          setPartnerAnswer(answer.selected_option);
        }
        return prevSession;
      });
    });

    return () => {
      unsubSession();
      unsubPlayers();
      unsubAnswers();
    };
  }, [roomCode, fetchSession, userId]);

  // Re-subscribe or fetch missing when session.id becomes available
  useEffect(() => {
    if (!session?.id) return;
    sessionIdRef.current = session.id;
    const refreshPlayers = async () => {
      const data = await GameService.fetchPlayers(session.id);
      if (data) setPlayers(data);
    };
    refreshPlayers();
  }, [session?.id]);

  // Submit answer via API
  const submitAnswer = useCallback(async (questionIndex: number, selectedOption: string) => {
    if (!session?.id) throw new Error('Session not ready');
    return await GameService.submitAnswer(session.id, questionIndex, selectedOption);
  }, [session?.id]);

  // Start game via API
  const startGame = useCallback(async (settings?: { questionCount?: number; includeAdult?: boolean }) => {
    if (!session?.id) throw new Error('Session not ready');
    return await GameService.startGame(session.id, settings);
  }, [session?.id]);

  return {
    session,
    players,
    loading,
    error,
    isHost,
    playerCount,
    bothPlayersPresent,
    currentAnswers,
    partnerAnswered,
    partnerAnswer,
    submitAnswer,
    startGame,
    refetch: fetchSession,
  };
}
