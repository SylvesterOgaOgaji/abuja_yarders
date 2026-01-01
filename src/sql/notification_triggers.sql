-- Trigger function to notify admins when a new pledge is made
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
    IF v_pledger_name IS NULL THEN
        v_pledger_name := 'A user';
    END IF;

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
        '/dashboard', -- Redirect to dashboard to see it
        NEW.id
    );

    -- Loop through all admins and sub-admins to notify them
    FOR v_admin_id IN 
        SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'sub_admin')
    LOOP
        PERFORM public.create_notification(
            v_admin_id,
            'New Pledge: ' || CASE WHEN NEW.amount_pledged > 0 THEN '₦' || NEW.amount_pledged ELSE 'Willing Support' END,
            v_pledger_name || ' made a new pledge' || 
                CASE WHEN v_call_title IS NOT NULL THEN ' for ' || v_call_title ELSE '' END || '.',
            'pledge',
            '/admin/pledges',
            NEW.id
        );
    END LOOP;

    RETURN NEW;
END;
$$;

-- Create trigger for pledges
DROP TRIGGER IF EXISTS on_pledge_created ON public.user_commitments;
CREATE TRIGGER on_pledge_created
    AFTER INSERT ON public.user_commitments
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_on_new_pledge();


-- Trigger function to notify ALL users when a new Support Call (Funding) is created
CREATE OR REPLACE FUNCTION public.notify_all_on_new_support_call()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Only notify on INSERT or if manually reactivating? Let's stick to INSERT for now to avoid spam on edits.
    -- Or maybe if is_active is true.
    IF NEW.is_active = true THEN
        FOR v_user_id IN SELECT id FROM public.profiles
        LOOP
            -- Avoid notifying the creator if possible, but profiles doesn't link to auth.users directly in a way to check 'created_by' easily if it's not stored. 
            -- Assuming we notify everyone.
            PERFORM public.create_notification(
                v_user_id,
                'New ' || INITCAP(NEW.category) || ' Call',
                NEW.title || ': Help is needed. Click to view details.',
                'funding',
                '/', -- Main dashboard where calls are listed
                NEW.id
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for support calls
DROP TRIGGER IF EXISTS on_support_call_created ON public.support_calls;
CREATE TRIGGER on_support_call_created
    AFTER INSERT ON public.support_calls
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_all_on_new_support_call();


-- Trigger function to notify admins of new Seller Requests
CREATE OR REPLACE FUNCTION public.notify_admins_on_seller_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_requester_name TEXT;
BEGIN
    SELECT full_name INTO v_requester_name FROM public.profiles WHERE id = NEW.user_id;
    IF v_requester_name IS NULL THEN
        v_requester_name := 'A user';
    END IF;

    FOR v_admin_id IN 
        SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'sub_admin')
    LOOP
        PERFORM public.create_notification(
            v_admin_id,
            'New Seller Request',
            v_requester_name || ' has applied to become a seller.',
            'system',
            '/admin/users', -- Or where requests are managed
            NEW.id
        );
    END LOOP;

    RETURN NEW;
END;
$$;

-- Create trigger for seller requests
DROP TRIGGER IF EXISTS on_seller_request_created ON public.seller_requests;
CREATE TRIGGER on_seller_request_created
    AFTER INSERT ON public.seller_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_on_seller_request();


-- Trigger function to notify group members of LINKS in chat
CREATE OR REPLACE FUNCTION public.notify_chat_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_id UUID;
    v_sender_name TEXT;
    v_group_name TEXT;
BEGIN
    -- Only proceed if content contains http or https
    IF NEW.content ILIKE '%http%' THEN
        -- Get sender name
        SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
        IF v_sender_name IS NULL THEN v_sender_name := 'Someone'; END IF;

        -- Get group name
        SELECT name INTO v_group_name FROM public.groups WHERE id = NEW.group_id;

        -- Notify all other group members
        FOR v_member_id IN
            SELECT user_id FROM public.group_members WHERE group_id = NEW.group_id AND user_id != NEW.sender_id
        LOOP
            PERFORM public.create_notification(
                v_member_id,
                'Link shared in ' || COALESCE(v_group_name, 'Chat'),
                v_sender_name || ': shared a link. Click to view.',
                'chat_link',
                '/?group=' || NEW.group_id,
                NEW.id
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for chat messages
DROP TRIGGER IF EXISTS on_chat_message_created ON public.messages;
CREATE TRIGGER on_chat_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_chat_links();
