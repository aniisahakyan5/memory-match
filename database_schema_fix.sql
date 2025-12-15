-- ============================================
-- Memory Match Game - Database Schema Fix
-- ============================================
-- This fixes the authentication error:
-- "null value in column "password_hash" of relation "profiles" violates not-null constraint"
--
-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Step 1: Drop the incorrect password_hash column if it exists
ALTER TABLE profiles DROP COLUMN IF EXISTS password_hash;

-- Step 2: Ensure the profiles table has the correct structure
-- Drop and recreate if needed
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security policies

-- Policy: Everyone can read all profiles (for leaderboard)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Policy: Users can only insert their own profile (matches their auth.uid())
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Users can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Step 5: Verify the schema (optional check)
-- Run this separately to confirm the fix:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;

-- Expected result:
-- id          | uuid                     | NO  | (references auth.users)
-- username    | text                     | NO  | NULL
-- created_at  | timestamp with time zone | YES | now()
