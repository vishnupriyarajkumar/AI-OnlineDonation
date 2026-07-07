USE charity_db;

-- Make email nullable
ALTER TABLE users
MODIFY COLUMN email VARCHAR(255) NULL;

-- Disable safe update mode
SET SQL_SAFE_UPDATES = 0;

-- Verify all existing users
UPDATE users
SET is_verified = TRUE;

-- Reset failed login attempts (only if this column exists)
UPDATE users
SET failed_login_attempts = 0;

-- Clear last failed login (only if this column exists)
UPDATE users
SET last_failed_login = NULL;

-- Enable safe update mode again
SET SQL_SAFE_UPDATES = 1;

-- Verify the data
SELECT
    user_id,
    full_name,
    email,
    phone,
    is_verified,
    failed_login_attempts,
    last_failed_login
FROM users;

