const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (css, js, images), but DO NOT serve index.html automatically
// This forces the root request to fall through to our custom handler
app.use(express.static(__dirname, { index: false }));

// Intercept root request to inject config
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');

    fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error loading game');
        }

        // Securely inject variables into the HTML
        // This is done on the server, so the raw variables are never exposed in the source code
        // The browser receives them as a global object
        const configScript = `
        <script>
            window.GAME_CONFIG = {
                SUPABASE_URL: "${process.env.SUPABASE_URL || ''}",
                SUPABASE_KEY: "${process.env.SUPABASE_KEY || ''}"
            };
        </script>
        `;

        // Replace the placeholder or inject before </head>
        let result = data;
        if (data.includes('<!-- ENV_INJECTION -->')) {
            result = data.replace('<!-- ENV_INJECTION -->', configScript);
        } else {
            // Fallback: Inject before head close
            result = data.replace('</head>', `${configScript}</head>`);
        }

        res.send(result);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
