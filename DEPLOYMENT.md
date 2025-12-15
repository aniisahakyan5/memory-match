# Deployment Guide

This guide covers how to properly deploy the Memory Match game to production.

## Why You Need a Server

The app **requires a Node.js server** in production because:
- Environment variables (Supabase credentials) must be injected server-side
- Opening `index.html` directly requires manual browser configuration
- Best security practice: credentials never exposed in source code

---

## Option 1: Deploy to Railway (Recommended)

**Railway** provides free Node.js hosting with automatic deployments from GitHub.

### Steps:

1. **Install Node.js locally (for testing)**
   - Download from: https://nodejs.org/
   - Install LTS version

2. **Create .env file**
   ```bash
   cp .env.example .env
   ```
   
3. **Edit .env with your Supabase credentials**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key-here
   ```

4. **Test locally**
   ```bash
   npm install
   npm start
   ```
   - Open http://localhost:3000
   - Verify auth works

5. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

6. **Deploy to Railway**
   - Go to https://railway.app
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add environment variables:
     - `SUPABASE_URL` = your Supabase URL
     - `SUPABASE_KEY` = your anon key
   - Railway will auto-deploy!

7. **Access your app**
   - Railway provides a URL like: `https://memory-match-production.up.railway.app`

---

## Option 2: Deploy to Vercel

**Vercel** also supports Node.js apps.

### Steps:

1. **Create vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set environment variables** in Vercel dashboard

---

## Option 3: Deploy to Render

**Render** offers free Node.js hosting.

### Steps:

1. Push code to GitHub
2. Go to https://render.com
3. Create new "Web Service"
4. Connect GitHub repo
5. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Add environment variables in dashboard
7. Deploy!

---

## Option 4: GitHub Pages (Limited - Not Recommended)

GitHub Pages only supports **static files**, not Node.js servers. To use it:

### Option 4a: Create Static Build

Create `build.js`:

```javascript
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const html = fs.readFileSync('index.html', 'utf8');

const configScript = `
<script>
    window.GAME_CONFIG = {
        SUPABASE_URL: "${SUPABASE_URL}",
        SUPABASE_KEY: "${SUPABASE_KEY}"
    };
</script>
`;

const result = html.replace('<!-- ENV_INJECTION -->', configScript);

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', result);

// Copy other files
const files = ['style.css', 'style_append.css', 'script.js', 'auth.js', 
               'db-cloud.js', 'manifest.json', 'sw.js', '.nojekyll',
               'icon-192.png', 'icon-512.png'];

files.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, `dist/${file}`);
    }
});

console.log('✅ Build complete! Deploy the dist/ folder.');
```

Add to `package.json`:
```json
"scripts": {
  "start": "node server.js",
  "build": "node build.js"
}
```

Then:
```bash
npm run build
```

Deploy the `dist/` folder to GitHub Pages.

> ⚠️ **Security Warning:** This exposes your Supabase key in the HTML source. Only use for development/testing!

---

## Environment Variables Required

For all deployment options, you need these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Your Supabase anon/public key | `eyJhbGc...` |
| `PORT` | Server port (optional) | `3000` |

---

## Troubleshooting

### "Database Not Connected" in production

**Cause:** Environment variables not set correctly

**Fix:**
1. Check deployment platform's environment variable settings
2. Verify variable names match exactly: `SUPABASE_URL` and `SUPABASE_KEY`
3. Restart the app after setting variables

### App works locally but not in production

**Cause:** `.env` file not pushed to deployment (this is correct - env files should be gitignored)

**Fix:** Set environment variables in your deployment platform's dashboard

### Node.js not installed locally

**Fix:** Download and install from https://nodejs.org/

---

## Recommended Setup

**For Production:** Railway or Render (free, auto-deploy from GitHub)

**For Development:** 
- Install Node.js
- Use `npm start` to run locally
- Test with actual Supabase connection

**Not Recommended:**
- Opening `index.html` directly (requires manual config)
- GitHub Pages static build (exposes credentials)
