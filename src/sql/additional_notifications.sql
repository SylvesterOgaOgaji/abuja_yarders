-- Trigger for Announcements via Dashboard CMS
-- Alerts everyone when an announcement field is updated in the CMS
CREATE OR REPLACE FUNCTION public.notify_all_on_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Check if the content is an announcement key and has a value
    IF (NEW.key ILIKE 'announcement_%' OR NEW.key = 'special_notice_link') AND (NEW.value IS NOT NULL AND NEW.value != '') THEN
        
        -- Default Title
        v_title := 'New Announcement';
        v_message := 'Check the dashboard for a new update: ' || LEFT(NEW.value, 50) || '...';

        -- Customize based on key if needed
        IF NEW.key = 'special_notice_link' THEN
             v_title := 'Special Notice';
             v_message := 'A special notice has been posted.';
        END IF;

        -- Notify all users
        FOR v_user_id IN SELECT id FROM public.profiles
        LOOP
             PERFORM public.create_notification(
                v_user_id,
                v_title,
                v_message,
                'announcement',
                '/', -- Dashboard
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


-- Function for Daily Birthdays
-- This function calculates today's date and sends notifications to users whose birthday matches.
-- NOTE: You should call this function once a day using a Scheduled Edge Function or Supabase Cron.
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
    -- Get current day and month
    SELECT EXTRACT(DAY FROM CURRENT_DATE) INTO v_day;
    SELECT EXTRACT(MONTH FROM CURRENT_DATE) INTO v_month;

    -- Loop through matching users
    FOR v_user IN 
        SELECT id, full_name FROM public.profiles 
        WHERE birth_day = v_day AND birth_month = v_month
    LOOP
        -- Insert notification
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
