-- Migration: Add submitter_email column to submissions table
-- This migration adds email tracking and duplicate prevention

ALTER TABLE submissions ADD COLUMN submitter_email VARCHAR(255);

-- Add index for better performance on duplicate checking
CREATE INDEX IF NOT EXISTS idx_submissions_form_email ON submissions(form_id, submitter_email);

-- Update existing submissions to have a default email (for backward compatibility)
UPDATE submissions SET submitter_email = 'unknown@example.com' WHERE submitter_email IS NULL;
