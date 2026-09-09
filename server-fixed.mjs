import http from 'node:http';
import zlib from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC = join(HERE, 'public');
const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-terra';

const packedSource = await readFile(join(HERE, 'server.mjs'), 'utf8');
const match = packedSource.match(/const ASSETS = (\{[\s\S]*?\});\nconst MIME/);
if (!match) throw new Error('Could not load packed GPT Realms assets.');
const PACKED = Function('"use strict"; return (' + match[1] + ')')();

const LIVE_GAME_GZ_B64 = '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';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 200000) throw new Error('Request too large');
  }
  return raw ? JSON.parse(raw) : {};
}

function fallbackDecision(state = {}) {
  const hp = Number(state.hpPct ?? 1);
  const enemies = Array.isArray(state.nearbyEnemies) ? state.nearbyEnemies : [];
  if (hp < 0.28) return { intent: 'retreat', targetId: null, say: 'Falling back!', reason: 'low health' };
  if (enemies.length) return { intent: 'fight', targetId: enemies[0].id ?? null, say: 'I have the nearest one.', reason: 'enemy in range' };
  return { intent: 'follow', targetId: null, say: '', reason: 'no immediate threat' };
}

async function askOpenAI(state) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ...fallbackDecision(state), source: 'fallback' };

  const allowed = ['follow', 'fight', 'retreat', 'explore', 'rest'];
  const prompt =
    'You control one fantasy MMO companion. Choose ONE high-level intent from: ' +
    allowed.join(', ') +
    '. Return strict JSON only with keys intent, targetId, say, reason. targetId must be null or an enemy id in STATE. say under 60 chars.\nSTATE:\n' +
    JSON.stringify(state);

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: prompt, max_output_tokens: 120 })
  });
  if (!response.ok) throw new Error('OpenAI ' + response.status + ': ' + (await response.text()).slice(0, 300));

  const data = await response.json();
  const text = data.output_text || data.output?.flatMap(i => i.content || []).map(c => c.text || '').join('') || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { ...fallbackDecision(state), source: 'fallback-invalid-model-output' };

  const parsed = JSON.parse(jsonMatch[0]);
  if (!allowed.includes(parsed.intent)) parsed.intent = 'follow';
  const ids = new Set((state.nearbyEnemies || []).map(e => String(e.id)));
  if (parsed.targetId != null && !ids.has(String(parsed.targetId))) parsed.targetId = null;
  parsed.say = String(parsed.say || '').slice(0, 60);
  parsed.reason = String(parsed.reason || '').slice(0, 120);
  return { ...parsed, source: MODEL };
}

async function getAsset(pathname) {
  const key = pathname === '/' ? 'index.html' : (pathname.startsWith('/') ? pathname.slice(1) : pathname);

  // Serve the verified game client first, before any legacy packed asset.
  if (key === 'game.js') {
    let source = zlib.gunzipSync(Buffer.from(LIVE_GAME_GZ_B64, 'base64')).toString('utf8');
    source = source.replace(
      "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
      "/three.module.js"
    );
    return { body: Buffer.from(source, 'utf8'), path: key };
  }

  // Serve Three.js locally from npm so the browser does not depend on a CDN.
  if (key === 'three.module.js') {
    return {
      body: await readFile(join(HERE, 'node_modules', 'three', 'build', 'three.module.js')),
      path: key
    };
  }

  const safe = normalize(key).replaceAll('\\\\', '/').split('/').filter(part => part && part !== '..').join('/');
  const filePath = join(PUBLIC, safe);
  if (filePath.startsWith(PUBLIC)) {
    try {
      return { body: await readFile(filePath), path: safe };
    } catch {}
  }

  const packed = PACKED[key];
  if (packed) {
    return { body: zlib.gunzipSync(Buffer.from(packed, 'base64')), path: key };
  }
  return null;
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(res, 200, { ok: true, gptEnabled: Boolean(process.env.OPENAI_API_KEY), model: MODEL });
    }

    if (req.method === 'POST' && url.pathname === '/api/agent/decide') {
      const body = await readJson(req);
      try {
        return sendJson(res, 200, await askOpenAI(body.state || {}));
      } catch (error) {
        return sendJson(res, 200, {
          ...fallbackDecision(body.state || {}),
          source: 'fallback-error',
          error: String(error.message || error)
        });
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405);
      return res.end('Method not allowed');
    }

    const asset = await getAsset(url.pathname);
    if (!asset) {
      res.writeHead(404, { 'cache-control': 'no-store' });
      return res.end('Not found');
    }

    const ext = extname(asset.path) || '.html';
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    if (req.method === 'HEAD') return res.end();
    res.end(asset.body);
  } catch (error) {
    sendJson(res, 500, { error: String(error.message || error) });
  }
}).listen(PORT, () => {
  console.log('GPT Realms fixed server running on ' + PORT);
});
