-- Retry: Update commitment type check constraint to include 'support_pledge'
-- This file ensures the constraint is dropped and re-created correctly.

DO $$
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_commitments_commitment_type_check') THEN
        ALTER TABLE "public"."user_commitments" DROP CONSTRAINT "user_commitments_commitment_type_check";
    END IF;
END $$;

-- Add the updated constraint
ALTER TABLE "public"."user_commitments" 
ADD CONSTRAINT "user_commitments_commitment_type_check" 
CHECK (commitment_type IN ('financial_pledge', 'volunteering', 'planning', 'support_pledge'));
