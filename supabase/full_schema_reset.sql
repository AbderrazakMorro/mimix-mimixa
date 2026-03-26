-- ==============================================================================
-- MIMIX-MIMIXA FULL DATABASE RESET SCHEMA
-- WARNING: Running this script will DELETE ALL EXISTING DATA in these tables.
-- ==============================================================================

-- 1. DROP ALL EXISTING TABLES AND PUBLICATIONS
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  DROP TABLE IF EXISTS message_reactions CASCADE;
  DROP TABLE IF EXISTS conversation_participants CASCADE;
  DROP TABLE IF EXISTS conversations CASCADE;
  DROP TABLE IF EXISTS messages CASCADE;
  DROP TABLE IF EXISTS relationships CASCADE;
  DROP TABLE IF EXISTS game_invites CASCADE;
  DROP TABLE IF EXISTS played_questions CASCADE;
  DROP TABLE IF EXISTS answers CASCADE;
  DROP TABLE IF EXISTS session_players CASCADE;
  DROP TABLE IF EXISTS results CASCADE;
  DROP TABLE IF EXISTS game_sessions CASCADE;
  DROP TABLE IF EXISTS questions CASCADE;
  DROP TABLE IF EXISTS user_stats CASCADE;
  DROP TABLE IF EXISTS profile_settings CASCADE;
  DROP TABLE IF EXISTS profiles CASCADE;
  DROP TABLE IF EXISTS avatars CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  
  DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
  DROP FUNCTION IF EXISTS find_private_conversation(UUID, UUID) CASCADE;
COMMIT;

-- ==============================================================================
-- 2. CORE TABLES (Users, Profiles, Avatars)
-- ==============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT,
  avatar_url TEXT,
  background_url TEXT,
  public_key JSONB,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO avatars (name, image_url, category) VALUES
  ('Cute Cat', 'https://api.dicebear.com/7.x/notionists/svg?seed=cat&backgroundColor=ffdfbf', 'animals'),
  ('Happy Dog', 'https://api.dicebear.com/7.x/notionists/svg?seed=dog&backgroundColor=b6e3f4', 'animals'),
  ('Cool Fox', 'https://api.dicebear.com/7.x/notionists/svg?seed=fox&backgroundColor=c0aede', 'animals'),
  ('Sleepy Bear', 'https://api.dicebear.com/7.x/notionists/svg?seed=bear&backgroundColor=ffd5dc', 'animals'),
  ('Boy Base', 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=b6e3f4', 'people'),
  ('Girl Base', 'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=ffd5dc', 'people')
ON CONFLICT DO NOTHING;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profile_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'light',
  background_url TEXT,
  language TEXT DEFAULT 'en',
  sound_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  games_played INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  best_match_percentage INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. CHAT & SOCIAL TABLES (Conversations, Messages, Relationships)
-- ==============================================================================

CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, partner_id)
);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT, 
    type TEXT NOT NULL CHECK (type IN ('private', 'game', 'global')) DEFAULT 'private',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'sticker', 'emoji', 'system')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

-- ==============================================================================
-- 4. GAME TABLES (Sessions, Answers, Results, Invites)
-- ==============================================================================

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL, 
  is_adult BOOLEAN DEFAULT FALSE,
  options JSONB NOT NULL,
  correct_match_logic TEXT DEFAULT 'exact_match'
);

CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting', 
  settings JSONB, 
  question_count INTEGER DEFAULT 10,
  current_question_index INTEGER DEFAULT 0,
  include_adult BOOLEAN DEFAULT FALSE,
  round INTEGER DEFAULT 1,
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE session_players (
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id)
);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER,
  selected_option TEXT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_answer_per_player_question UNIQUE (session_id, player_id, question_id)
);

CREATE TABLE played_questions (
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, question_index)
);

CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  compatibility_score INTEGER DEFAULT 0,
  insights JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'ignored')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TRIGGERS & FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, new.username, new.username);
  
  INSERT INTO public.profile_settings (user_id)
  VALUES (new.id);
  
  INSERT INTO public.user_stats (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION find_private_conversation(user1 UUID, user2 UUID)
RETURNS SETOF conversations AS $$
BEGIN
    RETURN QUERY
    SELECT c.*
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE c.type = 'private'
    AND cp1.user_id = user1
    AND cp2.user_id = user2;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE played_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for avatars" ON avatars FOR SELECT USING (true);
CREATE POLICY "Allow public read for profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read for profile_settings" ON profile_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read for user_stats" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Allow public read for users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public update for users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public read for relationships" ON relationships FOR SELECT USING (true);
CREATE POLICY "Allow public insert for relationships" ON relationships FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for relationships" ON relationships FOR UPDATE USING (true);
CREATE POLICY "Allow public read for messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert for messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can see reactions" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reactions" ON message_reactions FOR ALL USING (true);
CREATE POLICY "Users can see their conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Users can see participants" ON conversation_participants FOR SELECT USING (true);
CREATE POLICY "Allow public read for played_questions" ON played_questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert for played_questions" ON played_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read for game_sessions" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert for game_sessions" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for game_sessions" ON game_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public read for session_players" ON session_players FOR SELECT USING (true);
CREATE POLICY "Allow public insert for session_players" ON session_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read for answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Allow public insert for answers" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read for game_invites" ON game_invites FOR SELECT USING (true);
CREATE POLICY "Allow public insert for game_invites" ON game_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for game_invites" ON game_invites FOR UPDATE USING (true);

-- ==============================================================================
-- 7. ENABLE SUPABASE REALTIME
-- ==============================================================================

BEGIN;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE relationships;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_players;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;
ALTER PUBLICATION supabase_realtime ADD TABLE played_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_invites;

-- ==============================================================================
-- 8. STORAGE BUCKETS (Optional execution depending on if it exists)
-- ==============================================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('backgrounds', 'backgrounds', true) ON CONFLICT DO NOTHING;
