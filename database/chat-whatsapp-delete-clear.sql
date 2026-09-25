-- ==============================================================================
-- LAGNA SETU — CHAT WHATSAPP DELETE & CLEAR CHAT HISTORY MIGRATION
-- Run this script in Supabase SQL Editor (Safe & Idempotent)
-- ==============================================================================

-- 1. Ensure columns exist on public.messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS deleted_for_users JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add performance index on is_deleted
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON public.messages(is_deleted);

-- 3. Confirm Realtime Publication includes all columns
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 4. Enable RLS and verify policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
CREATE POLICY "Messages are viewable by everyone" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Messages can be created by everyone" ON public.messages;
CREATE POLICY "Messages can be created by everyone" ON public.messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Messages can be updated by everyone" ON public.messages;
CREATE POLICY "Messages can be updated by everyone" ON public.messages FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Messages can be deleted by everyone" ON public.messages;
CREATE POLICY "Messages can be deleted by everyone" ON public.messages FOR DELETE USING (true);
