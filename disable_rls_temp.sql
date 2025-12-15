-- ============================================
-- TEMPORARY FIX: Disable RLS for Testing
-- ============================================
-- This completely disables Row Level Security on profiles table
-- so we can test registration. You can re-enable it later.

-- Disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Also disable on scores table just in case
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;

-- NOTE: This makes the tables publicly writable
-- For production, you should re-enable RLS and fix the policies properly
-- But for testing, this will unblock registration
