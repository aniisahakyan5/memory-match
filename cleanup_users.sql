-- ============================================
-- Delete Failed Registration Attempts
-- ============================================
-- This will delete all users from auth.users so you can start fresh
-- and reuse your email addresses

-- WARNING: This deletes ALL users from your database!
-- Only run this if you're testing and have no real users yet

-- Delete all users (cascades to profiles table automatically)
DELETE FROM auth.users;

-- Verify they're gone
SELECT email FROM auth.users;

-- Expected result: 0 rows (empty)
