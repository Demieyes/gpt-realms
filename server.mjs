import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC = join(HERE, 'public');
const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6';

const MIME={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp'
};

function sendJson(res,status,body){
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
  res.end(JSON.stringify(body));
}

async function readJson(req){
  let raw='';
  for await (const chunk of req){
    raw+=chunk;
    if(raw.length>200000) throw new Error('Request too large');
  }
  return raw?JSON.parse(raw):{};
}

function fallbackDecision(state={}){
  const hp=Number(state.hpPct??1);
  const enemies=Array.isArray(state.nearbyEnemies)?state.nearbyEnemies:[];
  if(hp<0.28)return{intent:'retreat',targetId:null,say:'Falling back!',reason:'low health',source:'fallback'};
  if(enemies.length)return{intent:'fight',targetId:enemies[0].id??null,say:'I have the nearest one.',reason:'enemy in range',source:'fallback'};
  return{intent:'follow',targetId:null,say:'',reason:'no immediate threat',source:'fallback'};
}

async function askOpenAI(state){
  const key=process.env.OPENAI_API_KEY;
  if(!key)return fallbackDecision(state);
  const prompt='You control one fantasy MMO companion. Return strict JSON with intent,targetId,say,reason. Allowed intents: follow,fight,retreat,explore,rest. STATE:\n'+JSON.stringify(state);
  const response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{authorization:'Bearer '+key,'content-type':'application/json'},
    body:JSON.stringify({model:MODEL,input:prompt,max_output_tokens:120})
  });
  if(!response.ok)throw new Error('OpenAI '+response.status);
  const data=await response.json();
  const text=data.output_text||'';
  const m=text.match(/\{[\s\S]*\}/);
  return m?{...JSON.parse(m[0]),source:MODEL}:fallbackDecision(state);
}

async function getFile(pathname){
  if(pathname==='/three.module.js'){
    return {path:join(HERE,'node_modules','three','build','three.module.js'),name:'three.module.js'};
  }
  const raw=pathname==='/'?'index.html':pathname.slice(1);
  const safe=normalize(raw).replaceAll('\\','/').split('/').filter(p=>p&&p!=='..').join('/');
  const path=join(PUBLIC,safe);
  if(!path.startsWith(PUBLIC))return null;
  const info=await stat(path).catch(()=>null);
  if(!info?.isFile())return null;
  return {path,name:safe};
}

http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://'+(req.headers.host||'localhost'));

    if(req.method==='GET'&&url.pathname==='/api/health'){
      return sendJson(res,200,{ok:true,version:'0.3.0',gptEnabled:Boolean(process.env.OPENAI_API_KEY)});
    }

    if(req.method==='POST'&&url.pathname==='/api/agent/decide'){
      const body=await readJson(req);
      try{return sendJson(res,200,await askOpenAI(body.state||{}))}
      catch(error){return sendJson(res,200,{...fallbackDecision(body.state||{}),error:String(error.message||error)})}
    }

    if(req.method!=='GET'&&req.method!=='HEAD'){
      res.writeHead(405);return res.end('Method not allowed');
    }

    const file=await getFile(url.pathname);
    if(!file){res.writeHead(404,{'cache-control':'no-store'});return res.end('Not found')}

    const ext=extname(file.name)||'.html';
    res.writeHead(200,{'content-type':MIME[ext]||'application/octet-stream','cache-control':'no-store'});
    if(req.method==='HEAD')return res.end();
    res.end(await readFile(file.path));
  }catch(error){
    sendJson(res,500,{error:String(error.message||error)});
  }
}).listen(PORT,()=>console.log('GPT Realms v0.3.0 running on '+PORT));
