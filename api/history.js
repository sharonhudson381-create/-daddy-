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
