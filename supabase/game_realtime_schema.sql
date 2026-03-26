-- ============================================================
-- MIMIX & MIMIXA: Real-time Multiplayer Game Schema Extension
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Add multiplayer columns to game_sessions
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_question_id_fkey;

ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS player2_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS include_adult BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS round INTEGER DEFAULT 1;

-- Played questions tracker (prevents re-use within a session)
CREATE TABLE IF NOT EXISTS played_questions (
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, question_index)
);

-- Unique constraint: one answer per player per question per session
ALTER TABLE answers
ADD CONSTRAINT unique_answer_per_player_question
UNIQUE (session_id, player_id, question_id);

-- Enable RLS on played_questions
ALTER TABLE played_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for played_questions
CREATE POLICY "Allow public read for played_questions" ON played_questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert for played_questions" ON played_questions FOR INSERT WITH CHECK (true);

-- RLS Policies for game_sessions (if not already set)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for game_sessions" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert for game_sessions" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for game_sessions" ON game_sessions FOR UPDATE USING (true);

-- RLS Policies for session_players
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for session_players" ON session_players FOR SELECT USING (true);
CREATE POLICY "Allow public insert for session_players" ON session_players FOR INSERT WITH CHECK (true);

-- RLS Policies for answers
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Allow public insert for answers" ON answers FOR INSERT WITH CHECK (true);

-- Add played_questions to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE played_questions;
