-- ==============================================================================
-- LAGNA SETU — CHAT REALTIME & OFFLINE PERSISTENCE MIGRATION
-- Run this script in Supabase SQL Editor (Safe & Idempotent)
-- ==============================================================================

-- 1. Ensure columns exist on public.messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 2. Add performance indexes for rapid querying & unread count badge calculation
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON public.messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_email ON public.messages(receiver_email);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- 3. Confirm Realtime Publication for messages and interests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'interests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.interests;
    END IF;
END $$;

-- 4. Enable full row replica identity so Realtime receives complete record payloads
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.interests REPLICA IDENTITY FULL;

-- 5. Row Level Security policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
CREATE POLICY "Messages are viewable by everyone" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Messages can be created by everyone" ON public.messages;
CREATE POLICY "Messages can be created by everyone" ON public.messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Messages can be updated by everyone" ON public.messages;
CREATE POLICY "Messages can be updated by everyone" ON public.messages FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Messages can be deleted by everyone" ON public.messages;
CREATE POLICY "Messages can be deleted by everyone" ON public.messages FOR DELETE USING (true);
