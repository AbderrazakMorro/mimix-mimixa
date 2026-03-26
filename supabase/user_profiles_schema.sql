-- ============================================================
-- MIMIX & MIMIXA: User Profile System Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Avatars Table (Preset library)
CREATE TABLE IF NOT EXISTS avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and public read access
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for avatars" ON avatars FOR SELECT USING (true);

-- Insert some default cute avatars for pairs
INSERT INTO avatars (name, image_url, category) VALUES
  ('Cute Cat', 'https://api.dicebear.com/7.x/notionists/svg?seed=cat&backgroundColor=ffdfbf', 'animals'),
  ('Happy Dog', 'https://api.dicebear.com/7.x/notionists/svg?seed=dog&backgroundColor=b6e3f4', 'animals'),
  ('Cool Fox', 'https://api.dicebear.com/7.x/notionists/svg?seed=fox&backgroundColor=c0aede', 'animals'),
  ('Sleepy Bear', 'https://api.dicebear.com/7.x/notionists/svg?seed=bear&backgroundColor=ffd5dc', 'animals'),
  ('Boy Base', 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=b6e3f4', 'people'),
  ('Girl Base', 'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=ffd5dc', 'people')
ON CONFLICT DO NOTHING;


-- 2. Profiles Table 
-- NOTE: We explicitly drop the old table because it might be a leftover from Native Supabase Auth linking to auth.users.
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist in case the table was already created in a past iteration
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for profiles" ON profiles FOR SELECT USING (true);
-- Note: Security: Insert/Update relies on service role or proper policies, but we'll manage writes via Next.js API Routes using Service Role Keys to bypass RLS, so this is secure.


-- 3. Profile Settings Table
CREATE TABLE IF NOT EXISTS profile_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'light',
  background_url TEXT,
  language TEXT DEFAULT 'en',
  sound_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for profile_settings" ON profile_settings FOR SELECT USING (true);


-- 4. User Stats Table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  games_played INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  best_match_percentage INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for user_stats" ON user_stats FOR SELECT USING (true);


-- Provide a trigger to automatically create profile, settings, and stats when a user signs up
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

-- Trigger firing when a *new* user is created in our `users` table
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Add historical users to profiles if they don't exist
INSERT INTO profiles (id, username, display_name)
SELECT id, username, username FROM users
ON CONFLICT (id) DO NOTHING;

INSERT INTO profile_settings (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_stats (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
