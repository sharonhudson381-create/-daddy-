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

    try {
      const response = await fetch(baseUrl + '/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey,
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: process.env.MODEL_ID || 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: process.env.SYSTEM_PROMPT || '你是一个助手。',
          messages
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
