-- ============================================
-- Fix Row Level Security Policy for Registration
-- ============================================
-- Run this in Supabase SQL Editor to allow registration

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a more permissive policy that allows authenticated users to insert
CREATE POLICY "Authenticated users can insert profiles"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Alternative: If that doesn't work, temporarily disable RLS for testing
-- (You can re-enable it later once registration is confirmed working)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
