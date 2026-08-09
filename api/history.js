 var crypto = require('crypto');

  function keyFor(pwd) {
    var h = crypto.createHash('sha256').update(pwd).digest('hex');
    return 'chat_' + h.slice(0, 32);
  }

  function kvCmd(cmd) {
    var base = (process.env.KV_REST_API_URL || '').replace(/\/+$/, '');
    var token = process.env.KV_REST_API_TOKEN || '';
    return fetch(base, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cmd)
    }).then(function (r) {
      return r.text().then(function (txt) {
        var parsed;
        try {
          parsed = JSON.parse(txt);
        } catch (e) {
          throw new Error('KV 返回非 JSON（' + r.status + '）: ' + txt.slice(0, 200));
        }
        if (!r.ok || (parsed && parsed.error)) {
          throw new Error('KV 错误（' + r.status + '）: ' + (parsed.error || txt.slice(0, 200)));
        }
        return parsed;
      });
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
        var got = await kvCmd(['GET', key]);
        var raw = got && got.result;
        var msgs = [];
        if (raw && typeof raw === 'string') {
          try {
            var parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) msgs = parsed;
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
        await kvCmd(['SET', key, JSON.stringify(trimmed)]);
        return res.status(200).json({ ok: true, saved: trimmed.length });
      }

      if (req.method === 'DELETE') {
        await kvCmd(['DEL', key]);
        return res.status(200).json({ ok: true });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };
