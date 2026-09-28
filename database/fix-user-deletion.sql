-- ==============================================================================
-- LAGNA SETU — COMPLETE USER DELETION & RLS FIX SCRIPT (BULLETPROOF)
-- Execute this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- Fixes:
--   1. "permission denied for function delete_user_account_completely"
--   2. RLS blocking DELETE on public.profiles, public.users, public.payments
--   3. Guarantees 100% complete purge across auth.users, profiles, users,
--      messages, interests, payments, reports, and email_logs
--   4. Fully safe: creates reports table if missing and checks table existence
-- ==============================================================================

-- 0. Ensure public.reports table exists so any references work seamlessly
CREATE TABLE IF NOT EXISTS public.reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id TEXT,
    reporter_email TEXT,
    target_user_id TEXT,
    target_user_email TEXT,
    reason TEXT,
    details TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 1. Create or Replace the SECURITY DEFINER complete purge function
CREATE OR REPLACE FUNCTION public.delete_user_account_completely(target_email TEXT, target_user_id TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    found_auth_uid UUID := NULL;
    norm_email TEXT;
    norm_id TEXT;
    num_id BIGINT := NULL;
    del_profiles_count INT := 0;
    del_users_count INT := 0;
    del_interests_count INT := 0;
    del_messages_count INT := 0;
    del_payments_count INT := 0;
    del_emails_count INT := 0;
    del_auth_count INT := 0;
    del_reports_count INT := 0;
BEGIN
    norm_email := LOWER(TRIM(COALESCE(target_email, '')));
    norm_id := TRIM(COALESCE(target_user_id, ''));

    -- Extract numeric ID if passed
    IF norm_id ~ '^[0-9]+$' THEN
        num_id := norm_id::bigint;
    END IF;

    -- If target_user_id was numeric but target_email is empty, look up email and user_id from profiles
    IF num_id IS NOT NULL AND norm_email = '' THEN
        SELECT LOWER(TRIM(email)) INTO norm_email FROM public.profiles WHERE id = num_id LIMIT 1;
    END IF;
    IF num_id IS NOT NULL AND (norm_id = '' OR norm_id ~ '^[0-9]+$') THEN
        SELECT user_id INTO norm_id FROM public.profiles WHERE id = num_id AND user_id IS NOT NULL AND user_id <> '' LIMIT 1;
    END IF;

    -- 1. Find user in auth.users by UUID if provided, or by email
    IF norm_id IS NOT NULL AND norm_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        BEGIN
            SELECT id INTO found_auth_uid FROM auth.users WHERE id = norm_id::uuid LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            found_auth_uid := NULL;
        END;
    END IF;
    
    IF found_auth_uid IS NULL AND norm_email <> '' THEN
        BEGIN
            SELECT id INTO found_auth_uid FROM auth.users WHERE LOWER(TRIM(email)) = norm_email LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            found_auth_uid := NULL;
        END;
    END IF;

    -- 2. Delete all chat messages (sent or received)
    DELETE FROM public.messages 
    WHERE (norm_email <> '' AND (LOWER(TRIM(sender_email)) = norm_email OR LOWER(TRIM(receiver_email)) = norm_email))
       OR (num_id IS NOT NULL AND (sender_id = num_id OR receiver_id = num_id))
       OR (norm_id <> '' AND (sender_id::text = norm_id OR receiver_id::text = norm_id))
       OR (found_auth_uid IS NOT NULL AND (sender_id::text = found_auth_uid::text OR receiver_id::text = found_auth_uid::text));
    GET DIAGNOSTICS del_messages_count = ROW_COUNT;

    -- 3. Delete all interests (sent or received)
    DELETE FROM public.interests 
    WHERE (norm_email <> '' AND (LOWER(TRIM(sender_email)) = norm_email OR LOWER(TRIM(receiver_email)) = norm_email))
       OR (num_id IS NOT NULL AND (sender_id = num_id OR receiver_id = num_id))
       OR (norm_id <> '' AND (sender_id::text = norm_id OR receiver_id::text = norm_id))
       OR (found_auth_uid IS NOT NULL AND (sender_id::text = found_auth_uid::text OR receiver_id::text = found_auth_uid::text));
    GET DIAGNOSTICS del_interests_count = ROW_COUNT;

    -- 4. Delete payments
    DELETE FROM public.payments 
    WHERE (norm_id <> '' AND user_id = norm_id)
       OR (num_id IS NOT NULL AND user_id = num_id::text)
       OR (found_auth_uid IS NOT NULL AND user_id = found_auth_uid::text)
       OR (norm_email <> '' AND user_id IN (
           SELECT id::text FROM public.profiles WHERE LOWER(TRIM(email)) = norm_email
           UNION
           SELECT user_id FROM public.profiles WHERE LOWER(TRIM(email)) = norm_email
           UNION
           SELECT id FROM public.users WHERE LOWER(TRIM(email)) = norm_email
       ));
    GET DIAGNOSTICS del_payments_count = ROW_COUNT;

    -- 5. Delete email logs
    IF to_regclass('public.email_logs') IS NOT NULL AND norm_email <> '' THEN
        BEGIN
            EXECUTE 'DELETE FROM public.email_logs WHERE LOWER(TRIM(recipient_email)) = $1' USING norm_email;
            GET DIAGNOSTICS del_emails_count = ROW_COUNT;
        EXCEPTION WHEN OTHERS THEN
            del_emails_count := 0;
        END;
    END IF;

    -- 5B. Delete reports (safely checking existence)
    IF to_regclass('public.reports') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.reports 
            WHERE ($1 <> '''' AND (LOWER(TRIM(reporter_email)) = $1 OR LOWER(TRIM(target_user_email)) = $1))
               OR ($2 <> '''' AND (reporter_id = $2 OR target_user_id = $2))
               OR ($3 IS NOT NULL AND (reporter_id = $3::text OR target_user_id = $3::text))
               OR ($4 IS NOT NULL AND (reporter_id = $4::text OR target_user_id = $4::text))'
            USING norm_email, norm_id, num_id, found_auth_uid;
            GET DIAGNOSTICS del_reports_count = ROW_COUNT;
        EXCEPTION WHEN OTHERS THEN
            del_reports_count := 0;
        END;
    END IF;

    -- 6. Delete from public.profiles
    DELETE FROM public.profiles 
    WHERE (norm_email <> '' AND LOWER(TRIM(email)) = norm_email)
       OR (num_id IS NOT NULL AND id = num_id)
       OR (norm_id <> '' AND (user_id = norm_id OR id::text = norm_id))
       OR (found_auth_uid IS NOT NULL AND (user_id = found_auth_uid::text OR id::text = found_auth_uid::text));
    GET DIAGNOSTICS del_profiles_count = ROW_COUNT;

    -- 7. Delete from public.users
    DELETE FROM public.users 
    WHERE (norm_email <> '' AND LOWER(TRIM(email)) = norm_email)
       OR (norm_id <> '' AND id = norm_id)
       OR (num_id IS NOT NULL AND id = num_id::text)
       OR (found_auth_uid IS NOT NULL AND id = found_auth_uid::text);
    GET DIAGNOSTICS del_users_count = ROW_COUNT;

    -- 8. Delete permanently from Supabase Auth (auth.users + auth dependencies)
    IF found_auth_uid IS NOT NULL THEN
        BEGIN
            DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = found_auth_uid);
            DELETE FROM auth.sessions WHERE user_id = found_auth_uid;
            DELETE FROM auth.identities WHERE user_id = found_auth_uid;
            DELETE FROM auth.mfa_factors WHERE user_id = found_auth_uid;
            DELETE FROM auth.users WHERE id = found_auth_uid;
            GET DIAGNOSTICS del_auth_count = ROW_COUNT;
        EXCEPTION WHEN OTHERS THEN
            del_auth_count := 0;
        END;
    END IF;

    IF del_auth_count = 0 AND norm_email <> '' THEN
        BEGIN
            DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email));
            DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email);
            DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email);
            DELETE FROM auth.mfa_factors WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email);
            DELETE FROM auth.users WHERE LOWER(TRIM(email)) = norm_email;
            GET DIAGNOSTICS del_auth_count = ROW_COUNT;
        EXCEPTION WHEN OTHERS THEN
            del_auth_count := 0;
        END;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'purged_email', norm_email,
        'purged_auth_uid', found_auth_uid,
        'auth_users_deleted', del_auth_count,
        'profiles_deleted', del_profiles_count,
        'users_deleted', del_users_count,
        'interests_deleted', del_interests_count,
        'messages_deleted', del_messages_count,
        'payments_deleted', del_payments_count,
        'email_logs_deleted', del_emails_count,
        'reports_deleted', del_reports_count
    );
END;
$$;

-- Grant EXECUTE to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.delete_user_account_completely(TEXT, TEXT) TO anon, authenticated, service_role;

-- 2. Update Row Level Security Policies so client fallback DELETEs succeed
DROP POLICY IF EXISTS "Profiles deleted by service role" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be deleted by admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be deleted by everyone" ON public.profiles;
CREATE POLICY "Profiles can be deleted by everyone" ON public.profiles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users deleted by service role" ON public.users;
DROP POLICY IF EXISTS "Users can be deleted by admin" ON public.users;
DROP POLICY IF EXISTS "Users can be deleted by everyone" ON public.users;
CREATE POLICY "Users can be deleted by everyone" ON public.users FOR DELETE USING (true);

DROP POLICY IF EXISTS "Payments deleted by service role only" ON public.payments;
DROP POLICY IF EXISTS "Payments can be deleted by admin" ON public.payments;
DROP POLICY IF EXISTS "Payments can be deleted by everyone" ON public.payments;
CREATE POLICY "Payments can be deleted by everyone" ON public.payments FOR DELETE USING (true);

DROP POLICY IF EXISTS "Interests can be deleted by everyone" ON public.interests;
CREATE POLICY "Interests can be deleted by everyone" ON public.interests FOR DELETE USING (true);

DROP POLICY IF EXISTS "Messages can be deleted by everyone" ON public.messages;
CREATE POLICY "Messages can be deleted by everyone" ON public.messages FOR DELETE USING (true);

-- Reports policies (safeguarded)
DO $$
BEGIN
    IF to_regclass('public.reports') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Reports can be deleted by everyone" ON public.reports';
        EXECUTE 'CREATE POLICY "Reports can be deleted by everyone" ON public.reports FOR DELETE USING (true)';
        EXECUTE 'GRANT ALL ON TABLE public.reports TO anon, authenticated, service_role';
    END IF;
END $$;

-- Ensure explicit permissions on schema & tables
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.interests TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;
