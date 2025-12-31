-- Drop existing check constraint
ALTER TABLE "public"."user_commitments" DROP CONSTRAINT IF EXISTS "user_commitments_commitment_type_check";

-- Re-add check constraint with 'support_pledge'
ALTER TABLE "public"."user_commitments" 
ADD CONSTRAINT "user_commitments_commitment_type_check" 
CHECK (commitment_type IN ('financial_pledge', 'volunteering', 'planning', 'support_pledge'));
