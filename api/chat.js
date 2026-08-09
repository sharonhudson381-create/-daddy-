// 挪到文件顶部，不要放进函数内重复加载
const PERSONA = require('../persona');
const MAX_TURNS = 20; // 大幅缩减上下文，优先只保留最近20轮，减轻负载

module.exports = async (req, res) => {
    // CORS 跨域配置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-password');

    // 预检OPTIONS快速放行
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // 只允许POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 组装Claude多模态消息结构
    function buildMessageItem(msg) {
        const { role, content, image } = msg;
        if (!image) {
            return { role, content };
        }
        const contentArr = [];
        if (content && content.trim()) {
            contentArr.push({ type: "text", text: content });
        }
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
        return { role, content: contentArr };
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages 不能为空' });
    }

    const baseUrl = (process.env.API_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '');
    const apiKey = (process.env.API_KEY || '').trim();
    const gate = (process.env.ACCESS_PASSWORD || '').trim();

    // 口令校验
    if (gate) {
        const given = (req.headers['x-access-password'] || '').trim();
        if (given !== gate) {
            return res.status(401).json({ error: '口令不对' });
        }
    }

    if (!apiKey) {
        return res.status(500).json({ error: '服务端未配置 API_KEY' });
    }

    const systemPrompt = process.env.SYSTEM_PROMPT?.trim() || PERSONA;
    const recent = messages.slice(-MAX_TURNS);
    const formattedRecent = recent.map(item => buildMessageItem(item));

    // Vercel最大10s，后端超时设置8s，抢在平台杀进程之前主动返回超时
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(`${baseUrl}/v1/messages`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                model: process.env.MODEL_ID || 'claude-sonnet-4',
                max_tokens: 1024, // 适当降低单次输出token，缩短生成耗时
                system: systemPrompt,
                messages: formattedRecent
            })
        });
        clearTimeout(timer);

        const raw = await response.text();
        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            return res.status(502).json({
                error: `上游返回非JSON，状态码${response.status}：${raw.slice(0, 300)}`,
                endpoint: baseUrl
            });
        }

        if (!response.ok) {
            return res.status(response.status).json({
                error: data?.error?.message || JSON.stringify(data).slice(0, 300),
                upstream_status: response.status
            });
        }

        return res.status(200).json(data);

    } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
            // 后端主动超时，精准返回，不再等到Vercel强行断连
            return res.status(504).json({ error: '服务器响应超时，当前线路拥堵，精简文字或稍后重试' });
        }
        return res.status(500).json({ error: err.message });
    }
};
