-- Force fix: Drop and recreate commitment type constraint
-- Using simple SQL syntax to avoid PL/pgSQL issues

ALTER TABLE "public"."user_commitments" DROP CONSTRAINT IF EXISTS "user_commitments_commitment_type_check";

ALTER TABLE "public"."user_commitments" 
ADD CONSTRAINT "user_commitments_commitment_type_check" 
CHECK (commitment_type IN ('financial_pledge', 'volunteering', 'planning', 'support_pledge'));
