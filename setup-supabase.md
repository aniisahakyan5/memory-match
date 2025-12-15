# Supabase Configuration Guide

## ⚠️ STEP 1: Fix Database Schema First!

**If you're getting the "password_hash" error, run this SQL first:**

1. Go to https://supabase.com/dashboard → Your Project → **SQL Editor**
2. Click **New Query** and paste this SQL:

```sql
-- Fix profiles table schema
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scores table if needed
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    level INTEGER NOT NULL,
    moves INTEGER NOT NULL,
    time_seconds INTEGER NOT NULL,
    time_str TEXT NOT NULL,
    points INTEGER NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- Scores Policies
CREATE POLICY "Scores are viewable by everyone"
    ON scores FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert scores"
    ON scores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

3. Click **Run** ✅

---

## STEP 2: Configure Credentials

### For Railway (Production):
Add these environment variables in Railway dashboard:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_anon_key_here
```

### For Local Testing:
Click the red "Database Not Connected" warning and enter your credentials.

---

## STEP 3: Find Your Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → SUPABASE_URL
   - **anon/public key** → SUPABASE_KEY

---

## STEP 4: Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email**
3. Go to **Authentication** → **Email Auth**
4. **Toggle OFF "Confirm email"** (for easier testing)

---

## Troubleshooting

- **"password_hash" error** → Run the SQL from Step 1
- **"Database not connected"** → Check environment variables
- **Registration not working** → Make sure email confirmation is disabled
