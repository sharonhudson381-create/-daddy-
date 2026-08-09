const http = require('http');
const fs = require('fs');
const path = require('path');
let chatHandler;

try {
    chatHandler = require('./api/chat');
} catch (e) {
    console.error("加载api/chat.js失败：", e);
    chatHandler = async (req, res) => {
        res.writeHead(500, { 'Content-Type': 'application/json;charset=utf-8' });
        res.end(JSON.stringify({ error: "聊天接口文件加载失败" }));
    }
}

const setCors = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-access-password');
};

const getBody = req => new Promise(resolve => {
    let buf = [];
    req.on('data', d => buf.push(d));
    req.on('end', () => {
        try {
            resolve(JSON.parse(Buffer.concat(buf).toString()));
        } catch {
            resolve({});
        }
    });
});

const getContentType = (filePath) => {
    if (filePath.endsWith('.js')) return 'application/javascript;charset=utf-8';
    if (filePath.endsWith('.css')) return 'text/css;charset=utf-8';
    if (filePath.endsWith('.html')) return 'text/html;charset=utf-8';
    if (filePath.endsWith('.json')) return 'application/json;charset=utf-8';
    return 'application/octet-stream';
};

const server = http.createServer(async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // 统一去除路径首尾多余斜杠，兼容 /api/history、/api/history/
    const pathname = req.url.replace(/^\/+|\/+$/g, '');

    try {
        // 聊天接口 POST /api/chat
        if (pathname === 'api/chat' && req.method === 'POST') {
            req.body = await getBody(req);
            return await chatHandler(req, res);
        }

        // 历史记录接口 GET /api/history
        if (pathname === 'api/history' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
            return res.end(JSON.stringify([]));
        }

        // 静态资源处理
        let targetPath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
        fs.readFile(targetPath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
                return res.end(`404 Not Found: ${req.url}`);
            }
            res.writeHead(200, { 'Content-Type': getContentType(targetPath) });
            res.end(data);
        });
    } catch (err) {
        console.error("请求异常：", err);
        res.writeHead(500, { 'Content-Type': 'application/json;charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`服务已启动，监听端口：${PORT}`);
});

process.on('uncaughtException', err => {
    console.error("全局致命异常：", err);
});
