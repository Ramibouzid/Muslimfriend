import { readFileSync, existsSync } from 'fs';
import { createServer } from 'http';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(res, urlPath) {
  let filePath = join(DIST, urlPath === '/' ? 'index.html' : urlPath);
  if (!existsSync(filePath)) {
    filePath = join(DIST, 'index.html');
  }
  const ext = extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';
  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'POST' && req.url === '/api/recommend-verse') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { feeling } = JSON.parse(body);
        const apiKey = process.env.OPENROUTER_KEY;

        if (!apiKey) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'API key not configured on server' }));
          return;
        }

        const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a Quranic guidance assistant. Given a user\'s feeling or situation, recommend ONE relevant Quran verse. Respond ONLY with valid JSON: {"surah": number, "verse": number, "reason": "brief explanation in English"}. No markdown, no extra text.',
              },
              { role: 'user', content: feeling },
            ],
            max_tokens: 150,
          }),
        });

        if (!apiRes.ok) {
          const errText = await apiRes.text();
          console.error('OpenRouter error:', apiRes.status, errText);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'OpenRouter request failed' }));
          return;
        }

        const data = await apiRes.json();
        const content = data.choices?.[0]?.message?.content || '';
        const parsed = JSON.parse(content);

        if (!parsed.surah || !parsed.verse) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid response from OpenRouter' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ surah: parsed.surah, verse: parsed.verse, reason: parsed.reason }));
      } catch (err) {
        console.error('Server error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }

  serveStatic(res, req.url);
}).listen(PORT, () => {
  console.log(`MuslimFriend server running on port ${PORT}`);
});
