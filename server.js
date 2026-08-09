const http = require('http');
const fs = require('fs');
const path = require('path');
const chatHandler = require('./api/chat');

// 全局跨域头部
const setCors = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-access-password');
};

// 读取POST请求JSON
const getBody = req => new Promise(resolve => {
    let buf = [];
    req.on('data', d => buf.push(d));
    req.on('end', () => {
        try {
            resolve(JSON.parse(Buffer.concat(buf).toString()));
        } catch { resolve({}); }
    });
});

const server = http.createServer(async (req, res) => {
    setCors(res);
    // OPTIONS预检放行
    if (req.method === 'OPTIONS') return res.writeHead(204).end();

    // 聊天接口
    if (req.url === '/api/chat' && req.method === 'POST') {
        req.body = await getBody(req);
        return chatHandler(req, res);
    }

    // 首页静态页面
    const htmlPath = path.join(__dirname, 'index.html');
    fs.readFile(htmlPath, (err, html) => {
        if (err) return res.writeHead(404).end('页面不存在');
        res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        res.end(html);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`服务运行端口${PORT}`));
