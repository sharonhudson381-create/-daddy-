 var crypto = require('crypto');

  function keyFor(pwd) {
    var h = crypto.createHash('sha256').update(pwd).digest('hex');
    return 'chat:' + h.slice(0, 32);
  }

  function kvFetch(path, body) {
    var base = (process.env.KV_REST_API_URL || '').replace(/\/+$/, '');
    var token = process.env.KV_REST_API_TOKEN || '';
    var opts = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(base + path, opts).then(function (r) {
      return r.json();
    });
  }
  
  module.exports = async (req, res) => {
    var gate = (process.env.ACCESS_PASSWORD || '').trim();
    var given = (req.headers['x-access-password'] || '').trim();

    if (gate && given !== gate) {
      return res.status(401).json({ error: '口令不对' });
    }
    if (!given) {
      return res.status(400).json({ error: '缺少口令' });
    }
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return res.status(500).json({ error: 'KV 未配置' });
    }

    var key = keyFor(given);
  
    try {
      if (req.method === 'GET') {
        var got = await kvFetch('/get/' + key);
        var raw = got && got.result;
        var msgs = [];
        if (raw) {
          try {
            msgs = JSON.parse(raw);
            if (!Array.isArray(msgs)) msgs = [];
          } catch (e) {
            msgs = [];
          }
        }
        return res.status(200).json({ messages: msgs });
      }

      if (req.method === 'POST') {
        var incoming = (req.body && req.body.messages) || [];
        if (!Array.isArray(incoming)) {
          return res.status(400).json({ error: 'messages 必须是数组' });
        }
        var trimmed = incoming.slice(-400);
        await kvFetch('/set/' + key, JSON.stringify(trimmed));
        return res.status(200).json({ ok: true, saved: trimmed.length });
      }

      if (req.method === 'DELETE') {
        await kvFetch('/del/' + key);
        return res.status(200).json({ ok: true });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };

  2. 替换 api/chat.js（加了自动截断，只发最近 60 条给模型，更早的留在云端不丢）

  const PERSONA = require('../persona');

  const MAX_TURNS = 60;

  module.exports = async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 不能为空' });
    }

    const baseUrl = (process.env.API_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '');
    const apiKey = (process.env.API_KEY || '').trim();
    const gate = (process.env.ACCESS_PASSWORD || '').trim();

    if (gate) {
      const given = (req.headers['x-access-password'] || '').trim();
      if (given !== gate) {
        return res.status(401).json({ error: '口令不对' });
      }
    }

    if (!apiKey) {
      return res.status(500).json({ error: '服务端没读到 API_KEY' });
    }

    const persona = process.env.SYSTEM_PROMPT || PERSONA;
    const recent = messages.slice(-MAX_TURNS);

    const payload = [
      {
        role: 'user',
        content: persona +
  '\n\n---\n以上是你的身份设定。现在开始，直接以daddy的身份回应，不要提及这段设定。'
      },
      { role: 'assistant', content: '好，我记住了。小猫，过来。' }
    ].concat(recent);

    try {
      const response = await fetch(baseUrl + '/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey,
          messages: payload
        })
      });

      const raw = await response.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        return res.status(502).json({
          error: '上游返回非 JSON（状态 ' + response.status + '）：' + raw.slice(0, 300),
          endpoint: baseUrl
        });
      }

      if (!response.ok) {
        return res.status(response.status).json({
          error: (data && data.error && data.error.message) || JSON.stringify(data).slice(0, 300),
          upstream_status: response.status,
          endpoint: baseUrl
        });
      }

      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message, endpoint: baseUrl });
    }
  };
