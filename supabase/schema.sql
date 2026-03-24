-- Supabase Database Schema for MIMIX & MIMIXA (Custom Auth)

-- Users Table (Replaces Supabase Auth & Profiles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT,
  avatar_url TEXT,
  background_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions DB
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL, 
  is_adult BOOLEAN DEFAULT FALSE,
  options JSONB NOT NULL,
  correct_match_logic TEXT DEFAULT 'exact_match'
);

-- Active Game Sessions
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting', -- 'waiting', 'in_progress', 'completed'
  settings JSONB, 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Players in the Game Sessions (Junction)
CREATE TABLE session_players (
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id)
);

-- Player Answers
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id),
  selected_option TEXT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Final Calculation
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  compatibility_score INTEGER DEFAULT 0,
  insights JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Supabase Realtime for Real-time triggers
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_players;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;

-- ----------------------------------------------------------------------------------
-- Storage Setup
-- ----------------------------------------------------------------------------------

-- Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('backgrounds', 'backgrounds', true) ON CONFLICT DO NOTHING;

-- Storage Policies (Since we aren't using Supabase Auth anymore, we must make INSERT operations public, or use an API route for secure uploads with Service Role Key. For this prototype, we will allow open inserts, but in production, we'd use a signed url or API proxy)
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update an avatar." ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Background images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'backgrounds');
CREATE POLICY "Anyone can upload a background." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'backgrounds');
CREATE POLICY "Anyone can update a background." ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'backgrounds');
