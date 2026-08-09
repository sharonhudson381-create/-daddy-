const PERSONA = require('../persona');

const MAX_TURNS = 60;

// 将单条消息转为 Claude 支持的 content 结构（兼容纯文本 / 文本+图片）
function buildMessageItem(msg) {
    const { role, content, image } = msg;
    // 没有图片：直接返回字符串
    if (!image) {
        return { role, content };
    }

    // 携带 base64 图片，组装多模态数组格式
    const contentArr = [];
    // 文字部分
    if (content && content.trim()) {
        contentArr.push({
            type: "text",
            text: content
        });
    }
    // 图片部分，拆解 base64
    const [mimePart, base64Data] = image.split(',');
    const mediaType = mimePart.replace('data:', '');
    contentArr.push({
        type: "image",
        source: {
            type: "base64",
            media_type: mediaType,
            data: base64Data
        }
    });

    return {
        role,
        content: contentArr
    };
}

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

    // 固定开场人设引导消息
    const initMsgs = [
        {
            role: 'user',
            content: persona +
                '\n\n---\n以上是你的身份设定。现在开始，直接以daddy的身份回应，不要提及这段设定。'
        },
        { role: 'assistant', content: '好，我记住了。小猫，过来。' }
    ];

    // 遍历历史消息，自动处理图片格式
    const formattedRecent = recent.map(item => buildMessageItem(item));
    const payload = [...initMsgs, ...formattedRecent];

    try {
        const response = await fetch(baseUrl + '/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                model: process.env.MODEL_ID || 'claude-sonnet-4-6',
                max_tokens: 2048,
                system: persona,
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
