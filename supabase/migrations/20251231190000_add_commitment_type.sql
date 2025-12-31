-- Add commitment_type column to user_commitments
ALTER TABLE public.user_commitments
ADD COLUMN commitment_type TEXT CHECK (commitment_type IN ('fund_raising', 'volunteering', 'programme_planning', 'other')) DEFAULT 'fund_raising';

-- Update existing rows to have the default value (though DEFAULT clause handles new ones, this ensures clarity if constraints were weird, but postgres handles it)
UPDATE public.user_commitments SET commitment_type = 'fund_raising' WHERE commitment_type IS NULL;
