// Serverless function: forwards JSON to your n8n webhook
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  try {
    const url = process.env.N8N_WEBHOOK_URL; // set in Vercel (Step 3)
    const auth = process.env.N8N_AUTH_HEADER || ''; // optional "x-api-key: abc123"

    if (!url) {
      res.status(500).json({ error: 'Missing N8N_WEBHOOK_URL' });
      return;
    }

    const body = await readJson(req);

    const headers = { 'content-type': 'application/json' };
    if (auth) {
      const [k, ...v] = auth.split(':');
      headers[k.trim()] = v.join(':').trim();
    }

    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}