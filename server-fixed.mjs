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

const CLIENT_GAME_SOURCE = zlib.gunzipSync(Buffer.from(PACKED['game.js'], 'base64')).toString('utf8');
console.log('=== GPT REALMS CLIENT IMPORTS ===');
console.log((CLIENT_GAME_SOURCE.match(/^import .*$/gm) || []).join('\n'));
for (const term of ['CLASS_ORDER', 'CLASSES', 'class-grid', 'classGrid', 'Choose a class']) {
  const at = CLIENT_GAME_SOURCE.indexOf(term);
  if (at >= 0) {
    console.log('=== CLIENT SOURCE AROUND ' + term + ' ===');
    console.log(CLIENT_GAME_SOURCE.slice(Math.max(0, at - 1200), at + 3000));
  }
}

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
  const key = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');

  // Prefer normal files in /public. This makes future ChatGPT updates simple.
  const safe = normalize(key).replace(/^([.][.][/\\])+/, '').replace(/^[/\\]+/, '');
  const filePath = join(PUBLIC, safe);
  if (filePath.startsWith(PUBLIC)) {
    try {
      return { body: await readFile(filePath), path: safe };
    } catch {}
  }

  // Backward-compatible fallback for the original packed v0.2.2 assets.
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
