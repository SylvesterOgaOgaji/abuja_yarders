-- ENSURE NOTIFICATIONS & CRON

-- 1. Refresh Pledge Notifications Trigger
-- Ensure the function exists and is correct
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_pledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_pledger_name TEXT;
    v_call_title TEXT;
BEGIN
    -- Get pledger name
    SELECT full_name INTO v_pledger_name FROM public.profiles WHERE id = NEW.user_id;
    IF v_pledger_name IS NULL THEN v_pledger_name := 'A user'; END IF;

    -- Get call title if applicable
    IF NEW.support_call_id IS NOT NULL THEN
        SELECT title INTO v_call_title FROM public.support_calls WHERE id = NEW.support_call_id;
    END IF;

    -- Notify the user who pledged (Confirmation)
    PERFORM public.create_notification(
        NEW.user_id,
        'Pledge Received',
        'Thank you! Your pledge of ' || 
            CASE WHEN NEW.amount_pledged > 0 THEN '₦' || NEW.amount_pledged ELSE 'support' END || 
            ' has been recorded.',
        'success',
        '/dashboard', 
        NEW.id
    );

    -- Notify ADMINS and SUB_ADMINS
    FOR v_admin_id IN 
        SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'sub_admin')
    LOOP
        PERFORM public.create_notification(
            v_admin_id,
            'New Pledge: ' || CASE WHEN NEW.amount_pledged > 0 THEN '₦' || NEW.amount_pledged ELSE 'Willing Support' END,
            v_pledger_name || ' made a new pledge' || 
                CASE WHEN v_call_title IS NOT NULL THEN ' for ' || v_call_title ELSE '' END || '.',
            'pledge',
            '/admin/pledges', -- Ensure this route exists or adjust
            NEW.id
        );
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_pledge_created ON public.user_commitments;
CREATE TRIGGER on_pledge_created
    AFTER INSERT ON public.user_commitments
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_on_new_pledge();


-- 2. Announcement Notifications (Dashboard CMS)
CREATE OR REPLACE FUNCTION public.notify_all_on_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_title TEXT := 'New Announcement';
    v_message TEXT;
BEGIN
    -- Check if it's an announcement key and has a value
    IF (NEW.key ILIKE 'announcement_%' OR NEW.key = 'special_notice_link') AND (NEW.value IS NOT NULL AND NEW.value != '') THEN
        
        v_message := 'Check the dashboard for a new update.';
        IF NEW.key = 'special_notice_link' THEN
             v_title := 'Special Notice';
             v_message := 'A special notice has been posted.';
        END IF;

        -- Notify ALL users
        FOR v_user_id IN SELECT id FROM public.profiles
        LOOP
             PERFORM public.create_notification(
                v_user_id,
                v_title,
                v_message,
                'announcement',
                '/', 
                NULL
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_announcement_updated ON public.dashboard_content;
CREATE TRIGGER on_announcement_updated
    AFTER UPDATE ON public.dashboard_content
    FOR EACH ROW
    WHEN (OLD.value IS DISTINCT FROM NEW.value)
    EXECUTE FUNCTION public.notify_all_on_announcement();


-- 3. Birthday Notifications Cron Job
-- Ensure pg_cron extension exists
-- Supabase projects usually have pg_cron pre-installed or available.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Safely remove existing job and function
DO $$
BEGIN
    -- Try to unschedule the job, ignoring errors if it doesn't exist
    -- We can't delete from cron.job directly due to permissions, and unschedule throws if missing.
    BEGIN
        PERFORM cron.unschedule('daily-birthday-check');
    EXCEPTION WHEN OTHERS THEN
        -- Check if error is "could not find valid entry" (XX000) or similar, just ignore.
        NULL;
    END;
END $$;

-- Create the processing function
CREATE OR REPLACE FUNCTION public.process_daily_birthdays()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user record;
    v_day INTEGER;
    v_month INTEGER;
BEGIN
    SELECT EXTRACT(DAY FROM CURRENT_DATE) INTO v_day;
    SELECT EXTRACT(MONTH FROM CURRENT_DATE) INTO v_month;

    FOR v_user IN 
        SELECT id, full_name FROM public.profiles 
        WHERE birth_day = v_day AND birth_month = v_month
    LOOP
        PERFORM public.create_notification(
            v_user.id,
            'Happy Birthday!',
            'Happy Birthday ' || COALESCE(v_user.full_name, 'Yarder') || '! We wish you a wonderful day!',
            'birthday',
            '/profile',
            NULL
        );
    END LOOP;
END;
$$;

-- Schedule the job
-- We use a DO block or simple select, assuming cron.schedule exists.
SELECT cron.schedule(
    'daily-birthday-check',
    '0 9 * * *', -- 09:00 UTC
    $$SELECT public.process_daily_birthdays()$$
);
