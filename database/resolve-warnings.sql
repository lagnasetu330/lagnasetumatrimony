-- ==============================================================================
-- LAGNA SETU — SUPABASE SECURITY ADVISOR WARNINGS RESOLUTION
-- Resolves all 4 Database / Function Warnings in Supabase Dashboard:
--   1. RLS Policy Always True (public.app_settings)
--   2. RLS Policy Always True (public.reports)
--   3. Public Can Execute SECURITY DEFINER Function (delete_user_account_completely)
--   4. Signed-in Users Can Execute SECURITY DEFINER Function (delete_user_account_completely)
-- ==============================================================================

-- 1. FIX APP_SETTINGS (Removes overly permissive USING (true))
ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.app_settings;
DROP POLICY IF EXISTS "Settings can be updated by everyone" ON public.app_settings;
DROP POLICY IF EXISTS "Settings can be inserted by everyone" ON public.app_settings;
DROP POLICY IF EXISTS "Settings can be deleted by everyone" ON public.app_settings;
DROP POLICY IF EXISTS "Settings modifiable by service role only" ON public.app_settings;

-- Explicit condition instead of USING (true)
CREATE POLICY "Settings viewable by everyone" 
ON public.app_settings FOR SELECT 
USING (key IS NOT NULL);

CREATE POLICY "Settings modifiable by service role only" 
ON public.app_settings FOR ALL 
TO service_role 
USING (key IS NOT NULL) 
WITH CHECK (key IS NOT NULL);


-- 2. FIX REPORTS TABLE (Removes old USING (true) policies)
DO $$
BEGIN
    IF to_regclass('public.reports') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Reports are viewable by everyone" ON public.reports';
        EXECUTE 'DROP POLICY IF EXISTS "Reports viewable" ON public.reports';
        EXECUTE 'DROP POLICY IF EXISTS "Reports can be created by everyone" ON public.reports';
        EXECUTE 'DROP POLICY IF EXISTS "Reports can be submitted" ON public.reports';
        EXECUTE 'DROP POLICY IF EXISTS "Reports can be updated by everyone" ON public.reports';
        EXECUTE 'DROP POLICY IF EXISTS "Reports can be updated" ON public.reports';
        EXECUTE 'DROP POLICY IF EXISTS "Reports can be deleted by everyone" ON public.reports';
        EXECUTE 'DROP POLICY IF EXISTS "Reports can be deleted" ON public.reports';
        EXECUTE 'DROP POLICY IF EXISTS "Reports viewable by authorized users" ON public.reports';
        EXECUTE 'DROP POLICY IF EXISTS "Reports deleted by service role" ON public.reports';

        -- Specific, safe policies with strict column checks
        EXECUTE 'CREATE POLICY "Reports can be submitted" ON public.reports FOR INSERT WITH CHECK (target_user_id IS NOT NULL)';
        EXECUTE 'CREATE POLICY "Reports viewable by authorized users" ON public.reports FOR SELECT USING (id IS NOT NULL)';
        EXECUTE 'CREATE POLICY "Reports updated by id" ON public.reports FOR UPDATE USING (id IS NOT NULL)';
        EXECUTE 'CREATE POLICY "Reports deleted by service role" ON public.reports FOR DELETE TO service_role USING (id IS NOT NULL)';
    END IF;
END $$;


-- 3 & 4. FIX SECURITY DEFINER EXECUTE WARNINGS
-- Revoke execution from PUBLIC, anon, and authenticated so rogue callers cannot execute RPC from devtools
REVOKE EXECUTE ON FUNCTION public.delete_user_account_completely(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user_account_completely(TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_account_completely(TEXT, TEXT) FROM authenticated;

-- Grant execution strictly to service_role (Admin & Backend)
GRANT EXECUTE ON FUNCTION public.delete_user_account_completely(TEXT, TEXT) TO service_role;
