-- ================================================================
-- MANGAL SETU: COMPLETE AUTO-PURGE DATABASE TRIGGERS
-- Deletes all related data (profiles, users, interests, messages,
-- email_logs, reports) whenever a user is deleted from ANYWHERE!
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_user_complete_deletion()
RETURNS TRIGGER AS $$
DECLARE
    target_email TEXT;
BEGIN
    target_email := LOWER(COALESCE(OLD.email, ''));
    
    IF target_email IS NOT NULL AND target_email <> '' THEN
        -- 1. Delete matching profile
        DELETE FROM public.profiles WHERE LOWER(email) = target_email;
        
        -- 2. Delete matching user record (preserve system config)
        DELETE FROM public.users WHERE LOWER(email) = target_email AND role <> 'system';
        
        -- 3. Delete all interests sent or received
        DELETE FROM public.interests WHERE LOWER(sender_email) = target_email OR LOWER(receiver_email) = target_email;
        
        -- 4. Delete all messages sent or received
        DELETE FROM public.messages WHERE LOWER(sender_email) = target_email OR LOWER(receiver_email) = target_email;
        
        -- 5. Delete all email logs
        DELETE FROM public.email_logs WHERE LOWER(recipient_email) = target_email;
        
        -- 6. Delete all reports involving this user
        DELETE FROM public.reports WHERE LOWER(reporter_email) = target_email OR LOWER(target_user_email) = target_email;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger 1: When deleted from Supabase Auth (Authentication -> Users)
DROP TRIGGER IF EXISTS trg_on_auth_user_delete ON auth.users;
CREATE TRIGGER trg_on_auth_user_delete
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_complete_deletion();

-- Trigger 2: When deleted from Table Editor profiles
DROP TRIGGER IF EXISTS trg_on_profiles_delete ON public.profiles;
CREATE TRIGGER trg_on_profiles_delete
    AFTER DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_complete_deletion();

-- Trigger 3: When deleted from Table Editor users
DROP TRIGGER IF EXISTS trg_on_users_delete ON public.users;
CREATE TRIGGER trg_on_users_delete
    AFTER DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_complete_deletion();
