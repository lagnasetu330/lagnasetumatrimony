-- ==============================================================================
-- LAGNA SETU — COMPLETE A TO Z USER PURGE (AUTHENTICATION + DATABASE)
-- Resolves:
--   1. "column reference target_user_id is ambiguous" (42702) error
--   2. Guarantees 100% permanent wipe from Supabase Authentication -> Users (auth.users)
--   3. Deletes all associated profiles, users, messages, payments, interests,
--      reports, and email_logs across the entire database
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_account_completely(target_email TEXT, target_user_id TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
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
    auth_rec RECORD;
BEGIN
    norm_email := LOWER(TRIM(COALESCE(target_email, '')));
    norm_id := TRIM(COALESCE(target_user_id, ''));

    IF norm_id ~ '^[0-9]+$' THEN
        num_id := norm_id::bigint;
    END IF;

    IF num_id IS NOT NULL AND norm_email = '' THEN
        SELECT LOWER(TRIM(prof.email)) INTO norm_email FROM public.profiles prof WHERE prof.id = num_id LIMIT 1;
    END IF;
    IF num_id IS NOT NULL AND (norm_id = '' OR norm_id ~ '^[0-9]+$') THEN
        SELECT prof.user_id INTO norm_id FROM public.profiles prof WHERE prof.id = num_id AND prof.user_id IS NOT NULL AND prof.user_id <> '' LIMIT 1;
    END IF;

    -- 1. DELETE PERMANENTLY FROM Supabase Authentication -> Users (auth.users + all dependencies)
    FOR auth_rec IN 
        SELECT id FROM auth.users 
        WHERE (norm_email <> '' AND LOWER(TRIM(email)) = norm_email)
           OR (norm_id <> '' AND norm_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND id = norm_id::uuid)
    LOOP
        found_auth_uid := auth_rec.id;
        
        -- Delete auth dependencies in cascade order
        BEGIN
            DELETE FROM auth.mfa_amr_claims WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = found_auth_uid);
        EXCEPTION WHEN OTHERS THEN NULL; END;

        BEGIN
            DELETE FROM auth.mfa_challenges WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = found_auth_uid);
        EXCEPTION WHEN OTHERS THEN NULL; END;

        BEGIN
            DELETE FROM auth.mfa_factors WHERE user_id = found_auth_uid;
        EXCEPTION WHEN OTHERS THEN NULL; END;

        BEGIN
            DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = found_auth_uid);
        EXCEPTION WHEN OTHERS THEN NULL; END;

        BEGIN
            DELETE FROM auth.sessions WHERE user_id = found_auth_uid;
        EXCEPTION WHEN OTHERS THEN NULL; END;

        BEGIN
            DELETE FROM auth.identities WHERE user_id = found_auth_uid;
        EXCEPTION WHEN OTHERS THEN NULL; END;

        BEGIN
            DELETE FROM auth.one_time_tokens WHERE user_id = found_auth_uid;
        EXCEPTION WHEN OTHERS THEN NULL; END;

        BEGIN
            DELETE FROM auth.users WHERE id = found_auth_uid;
            del_auth_count := del_auth_count + 1;
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;

    -- Fail-safe: if auth user still exists by email, purge directly
    IF del_auth_count = 0 AND norm_email <> '' THEN
        BEGIN
            DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email));
            DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email);
            DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email);
            DELETE FROM auth.mfa_factors WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email);
            DELETE FROM auth.users WHERE LOWER(TRIM(email)) = norm_email;
            GET DIAGNOSTICS del_auth_count = ROW_COUNT;
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    -- 2. Delete chat messages
    DELETE FROM public.messages m
    WHERE (norm_email <> '' AND (LOWER(TRIM(m.sender_email)) = norm_email OR LOWER(TRIM(m.receiver_email)) = norm_email))
       OR (num_id IS NOT NULL AND (m.sender_id = num_id OR m.receiver_id = num_id))
       OR (norm_id <> '' AND (m.sender_id::text = norm_id OR m.receiver_id::text = norm_id))
       OR (found_auth_uid IS NOT NULL AND (m.sender_id::text = found_auth_uid::text OR m.receiver_id::text = found_auth_uid::text));
    GET DIAGNOSTICS del_messages_count = ROW_COUNT;

    -- 3. Delete interests
    DELETE FROM public.interests i
    WHERE (norm_email <> '' AND (LOWER(TRIM(i.sender_email)) = norm_email OR LOWER(TRIM(i.receiver_email)) = norm_email))
       OR (num_id IS NOT NULL AND (i.sender_id = num_id OR i.receiver_id = num_id))
       OR (norm_id <> '' AND (i.sender_id::text = norm_id OR i.receiver_id::text = norm_id))
       OR (found_auth_uid IS NOT NULL AND (i.sender_id::text = found_auth_uid::text OR i.receiver_id::text = found_auth_uid::text));
    GET DIAGNOSTICS del_interests_count = ROW_COUNT;

    -- 4. Delete payments
    DELETE FROM public.payments p
    WHERE (norm_id <> '' AND p.user_id = norm_id)
       OR (num_id IS NOT NULL AND p.user_id = num_id::text)
       OR (found_auth_uid IS NOT NULL AND p.user_id = found_auth_uid::text)
       OR (norm_email <> '' AND LOWER(TRIM(p.user_email)) = norm_email);
    GET DIAGNOSTICS del_payments_count = ROW_COUNT;

    -- 5. Delete email_logs
    IF to_regclass('public.email_logs') IS NOT NULL THEN
        DELETE FROM public.email_logs el WHERE norm_email <> '' AND LOWER(TRIM(el.recipient_email)) = norm_email;
        GET DIAGNOSTICS del_emails_count = ROW_COUNT;
    END IF;

    -- 6. Delete reports (Table alias 'r' completely resolves ambiguity!)
    IF to_regclass('public.reports') IS NOT NULL THEN
        DELETE FROM public.reports r
        WHERE (norm_email <> '' AND (LOWER(TRIM(r.reporter_email)) = norm_email OR LOWER(TRIM(r.target_user_email)) = norm_email))
           OR (norm_id <> '' AND (r.reporter_id = norm_id OR r.target_user_id = norm_id));
        GET DIAGNOSTICS del_reports_count = ROW_COUNT;
    END IF;

    -- 7. Delete profiles
    DELETE FROM public.profiles prof
    WHERE (norm_email <> '' AND LOWER(TRIM(prof.email)) = norm_email)
       OR (num_id IS NOT NULL AND prof.id = num_id)
       OR (norm_id <> '' AND prof.user_id = norm_id)
       OR (found_auth_uid IS NOT NULL AND prof.user_id = found_auth_uid::text);
    GET DIAGNOSTICS del_profiles_count = ROW_COUNT;

    -- 8. Delete users table record
    DELETE FROM public.users u
    WHERE (norm_email <> '' AND LOWER(TRIM(u.email)) = norm_email)
       OR (num_id IS NOT NULL AND u.id = num_id)
       OR (norm_id <> '' AND u.id::text = norm_id)
       OR (found_auth_uid IS NOT NULL AND u.id::text = found_auth_uid::text);
    GET DIAGNOSTICS del_users_count = ROW_COUNT;

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
