-- Real-time Game Invitations
CREATE TABLE IF NOT EXISTS game_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'ignored')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE game_invites ENABLE ROW LEVEL SECURITY;

-- Policies for Game Invites
CREATE POLICY "Allow public read for game_invites" ON game_invites FOR SELECT USING (true);
CREATE POLICY "Allow public insert for game_invites" ON game_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for game_invites" ON game_invites FOR UPDATE USING (true);

-- Add to Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE game_invites;
