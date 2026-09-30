-- ==============================================================================
-- LAGNA SETU: FIX PROFILES VISIBILITY & RLS POLICIES
-- Run this script in your Supabase Project Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. PROFILES TABLE: Fix SELECT policy
-- Previously, the SELECT policy had: AND COALESCE(visible, true) = true
-- In PostgreSQL, when an UPDATE sets visible = false, PostgreSQL checks if the
-- resulting row satisfies the SELECT policy. If not, UPDATE ... RETURNING fails
-- with error 42501 (new row violates row-level security policy for table "profiles").
-- By allowing SELECT on public.profiles, updates to visible = false succeed cleanly,
-- and Admin can view/moderate hidden profiles in the Admin Panel.

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by community" ON public.profiles;

CREATE POLICY "Profiles viewable by community" 
ON public.profiles FOR SELECT 
USING (true);


-- 2. PROFILES TABLE: Fix UPDATE policy
-- Allows profile owners, users, and admin to update their profile fields
-- including visibility toggle (visible = true / visible = false)
DROP POLICY IF EXISTS "Profiles can be updated by owner or system" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by everyone" ON public.profiles;

CREATE POLICY "Profiles can be updated by owner or system" 
ON public.profiles FOR UPDATE 
USING (true)
WITH CHECK (true);


-- 3. HELPER RPC FUNCTION: set_profile_visibility
-- Runs as SECURITY DEFINER to bypass any RLS constraints and immediately
-- updates both the visible column and raw_data.visible atomically.
CREATE OR REPLACE FUNCTION public.set_profile_visibility(p_id BIGINT, p_visible BOOLEAN)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET visible = p_visible,
        raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{visible}', to_jsonb(p_visible)),
        updated_at = NOW()
    WHERE id = p_id;

    RETURN json_build_object(
        'success', true, 
        'id', p_id, 
        'visible', p_visible,
        'updated_at', NOW()
    );
END;
$$;

-- Grant execution permission to public anon key and authenticated users
GRANT EXECUTE ON FUNCTION public.set_profile_visibility(BIGINT, BOOLEAN) TO anon, authenticated, service_role;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
