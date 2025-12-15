const fs = require('fs');

/**
 * Build Script for Static Deployment
 * Generates a dist/ folder with credentials baked into HTML
 * 
 * WARNING: This exposes your Supabase key in the HTML source!
 * Only use this for development/testing or if deploying to a trusted static host.
 * 
 * For production, use: Railway, Vercel, or Render with server.js
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set');
    console.error('   Set them in .env file or as environment variables');
    process.exit(1);
}

console.log('🔨 Building static version...');

// Read index.html
const html = fs.readFileSync('index.html', 'utf8');

// Create config script
const configScript = `
<script>
    window.GAME_CONFIG = {
        SUPABASE_URL: "${SUPABASE_URL}",
        SUPABASE_KEY: "${SUPABASE_KEY}"
    };
</script>
`;

// Inject config into HTML
const result = html.replace('<!-- ENV_INJECTION -->', configScript);

// Create dist directory
fs.mkdirSync('dist', { recursive: true });

// Write processed HTML
fs.writeFileSync('dist/index.html', result);
console.log('✅ Created dist/index.html');

// Copy all necessary files
const files = [
    'style.css',
    'style_append.css',
    'script.js',
    'auth.js',
    'db-cloud.js',
    'manifest.json',
    'sw.js',
    '.nojekyll',
    'icon-192.png',
    'icon-512.png'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, `dist/${file}`);
        console.log(`✅ Copied ${file}`);
    } else {
        console.log(`⚠️  Skipped ${file} (not found)`);
    }
});

console.log('\n✨ Build complete!');
console.log('📁 Deploy the dist/ folder to your static host');
console.log('\n⚠️  WARNING: Supabase credentials are visible in dist/index.html');
console.log('   For production, use Railway/Vercel/Render instead\n');
