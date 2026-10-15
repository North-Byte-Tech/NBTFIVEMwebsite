-- Databases created before this migration got the interview statuses (and
-- awaiting_brad_decision) outside the migration history, so a fresh database
-- never has them. Rename where the old label exists, then add whatever is
-- still missing, so this works on both.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'ApplicationStatus' AND e.enumlabel = 'awaiting_brad_decision'
  ) THEN
    ALTER TYPE "ApplicationStatus" RENAME VALUE 'awaiting_brad_decision' TO 'awaiting_final_decision';
  END IF;
END $$;

ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'interview_scheduled' BEFORE 'accepted';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'interview_completed' BEFORE 'accepted';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'awaiting_final_decision' BEFORE 'accepted';
