-- Advanced Chat System Schema (Conversations, Reactions, Stickers)

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT, -- only for group/game
    type TEXT NOT NULL CHECK (type IN ('private', 'game', 'global')) DEFAULT 'private',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Participants Table (Junction)
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

-- 3. Update/Recreate Messages to support conversations
-- (We keep the old messages for migration if needed, but the new system uses conversation_id)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'sticker', 'emoji', 'system'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'; -- For sticker details or custom data

-- 4. Message Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

-- 5. Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Users can see their conversations" ON conversations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid()) 
        OR type = 'global'
    );

CREATE POLICY "Users can see participants in their conversations" ON conversation_participants
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid())
    );

CREATE POLICY "Anyone can see reactions" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reactions" ON message_reactions
    FOR ALL USING (user_id = auth.uid());

-- 7. Add to Realtime Publication
-- (Assuming auth.uid() is handled by our custom JWT logic in API routes, 
-- but for supabase-realtime we need tables in the publication)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 8. Migration Logic (Optional: Only if you have existing messages)
DO $$
DECLARE
    msg_record RECORD;
    conv_id UUID;
BEGIN
    -- For each unique pair of people who have messaged, create a conversation if it doesn't exist
    FOR msg_record IN 
        SELECT DISTINCT 
            LEAST(sender_id, receiver_id) as u1, 
            GREATEST(sender_id, receiver_id) as u2 
        FROM messages 
        WHERE conversation_id IS NULL
    LOOP
        -- Create conversation
        INSERT INTO conversations (type) VALUES ('private') RETURNING id INTO conv_id;
        
        -- Add participants
        INSERT INTO conversation_participants (conversation_id, user_id) VALUES (conv_id, msg_record.u1), (conv_id, msg_record.u2);
        
        -- Update messages
        UPDATE messages 
        SET conversation_id = conv_id 
        WHERE (sender_id = msg_record.u1 AND receiver_id = msg_record.u2) 
           OR (sender_id = msg_record.u2 AND receiver_id = msg_record.u1);
    END LOOP;
END $$;

-- 9. Helper Functions
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

