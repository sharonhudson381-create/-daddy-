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

// 根据后缀匹配对应的MIME类型
const getContentType = (filePath) => {
    if(filePath.endsWith('.js')) return 'application/javascript;charset=utf-8';
    if(filePath.endsWith('.css')) return 'text/css;charset=utf-8';
    if(filePath.endsWith('.html')) return 'text/html;charset=utf-8';
    return 'application/octet-stream';
};

const server = http.createServer(async (req, res) => {
    setCors(res);
    // OPTIONS预检放行
    if (req.method === 'OPTIONS') return res.writeHead(204).end();

    // 聊天接口
    if (req.url === '/api/chat' && req.method === 'POST') {
        req.body = await getBody(req);
        return chatHandler(req, res);
    }

    // 拼接本地文件真实路径
    let targetPath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    fs.readFile(targetPath, (err, fileData) => {
        if (err) {
            res.writeHead(404, {'Content-Type':'text/plain;charset=utf-8'});
            return res.end('文件不存在');
        }
        res.writeHead(200, {
            'Content-Type': getContentType(targetPath)
        });
        res.end(fileData);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`服务运行端口${PORT}`));
