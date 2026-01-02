-- Add missing columns to notifications table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE public.notifications ADD COLUMN "type" TEXT NOT NULL DEFAULT 'system';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'action_link') THEN
        ALTER TABLE public.notifications ADD COLUMN "action_link" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'related_entity_id') THEN
        ALTER TABLE public.notifications ADD COLUMN "related_entity_id" UUID;
    END IF;
END $$;

-- Drop and recreate the check constraint to ensure all types are covered
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('pledge', 'funding', 'announcement', 'birthday', 'profile', 'chat_link', 'system', 'info', 'warning', 'success', 'seller_request'));
