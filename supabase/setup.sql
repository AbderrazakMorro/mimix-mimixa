-- Run this in the Supabase SQL Editor to create the required tables

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT,
  avatar_url TEXT,
  background_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting',
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_players (
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id)
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER,
  selected_option TEXT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);
