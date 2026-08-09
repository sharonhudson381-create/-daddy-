const http = require('http');
const fs = require('fs');
const path = require('path');
const chatHandler = require('./api/chat');

// 全局统一跨域头部
const setCors = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-access-password');
};

// 读取POST请求JSON数据
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

// 根据文件后缀返回对应MIME类型
const getContentType = (filePath) => {
    if (filePath.endsWith('.js')) return 'application/javascript;charset=utf-8';
    if (filePath.endsWith('.css')) return 'text/css;charset=utf-8';
    if (filePath.endsWith('.html')) return 'text/html;charset=utf-8';
    if (filePath.endsWith('.json')) return 'application/json;charset=utf-8';
    return 'application/octet-stream';
};

const server = http.createServer(async (req, res) => {
    setCors(res);

    // OPTIONS预检请求直接放行
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // 1. 聊天对话接口
    if (req.url === '/api/chat' && req.method === 'POST') {
        req.body = await getBody(req);
        return chatHandler(req, res);
    }

    // 2. 新增历史记录接口，返回空数组解决404报错
    if (req.url === '/api/history' && req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'application/json;charset=utf-8'
        });
        // 返回空聊天历史，前端不会再报404
        return res.end(JSON.stringify([]));
    }

    // 3. 托管页面、js、css等全部静态资源文件
    const targetPath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    fs.readFile(targetPath, (err, fileData) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
            return res.end('文件不存在');
        }
        res.writeHead(200, {
            'Content-Type': getContentType(targetPath)
        });
        res.end(fileData);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务已启动，监听端口：${PORT}`);
});
