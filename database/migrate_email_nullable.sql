-- Run this once to fix the users table in the live database
USE charity_db;

-- Make email nullable (required for mobile-only registration)
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL UNIQUE;

-- Add missing columns if not present (from recent code changes)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login DATETIME NULL;

-- Set existing users as verified so they can log in immediately
UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL OR is_verified = FALSE;

SELECT 'Migration complete' AS status;
