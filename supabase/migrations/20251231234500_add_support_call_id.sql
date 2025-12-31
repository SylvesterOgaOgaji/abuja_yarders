-- Add support_call_id to user_commitments
ALTER TABLE "public"."user_commitments" 
ADD COLUMN "support_call_id" uuid REFERENCES "public"."support_calls"("id") ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX "user_commitments_support_call_id_idx" ON "public"."user_commitments"("support_call_id");
