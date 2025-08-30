// /api/flow.js — proxy multiple n8n webhooks by action
export default async function handler(req, res) {
  const action = (req.query.action || "").toLowerCase(); // add | list | send
  const MAP = {
    add: process.env.N8N_ADD_URL,
    list: process.env.N8N_LIST_URL,
    send: process.env.N8N_SEND_URL,
  };
  const url = MAP[action];
  if (!url) return res.status(400).json({ error: 'bad action' });

  const headers = { 'content-type': 'application/json' };
  const auth = process.env.N8N_AUTH_HEADER || '';
  if (auth) {
    const [k, ...v] = auth.split(':');
    headers[k.trim()] = v.join(':').trim();
  }

  const method = req.method || 'GET';
  let body;
  if (method !== 'GET') {
    body = await readJson(req);
  }

  try {
    const upstream = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await upstream.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}