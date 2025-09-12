-- Add tagline column to User
ALTER TABLE "public"."User"
  ADD COLUMN "tagline" TEXT;

-- Optional: create index if needed in future
-- CREATE INDEX IF NOT EXISTS "User_tagline_idx" ON "public"."User"("tagline");
