// Quick Supabase Configuration Script
// Copy and paste this into your browser console (F12 → Console tab)

// Replace these with your actual Supabase credentials:
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';  // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';  // Your anon/public key

// Save to localStorage
localStorage.setItem('supabase_config', JSON.stringify({
    url: SUPABASE_URL,
    key: SUPABASE_KEY
}));

// Reload the page
location.reload();
