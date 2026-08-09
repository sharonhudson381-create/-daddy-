const http = require('http');
// 载入全局异常兜底
process.on('uncaughtException', (err) => {
    console.error('全局未捕获致命异常：', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('未处理的Promise异步异常：', reason);
});

// 引入接口处理函数
const chatHandler = require('./api/chat');
const PORT = process.env.PORT || 8080;

// 给请求回调加上 async，支持内部await
const server = http.createServer(async (req, res) => {
    // 截取纯路径，剔除url参数
    const pathname = req.url.split('?')[0];

    // ----------------------接口路由----------------------
    if (pathname === '/api/chat' && req.method === 'POST') {
        try {
            // 接收POST二进制流，手动解析JSON body
            let rawBody = '';
            for await (const chunk of req) {
                rawBody += chunk.toString('utf-8');
            }
            req.body = JSON.parse(rawBody || '{}');

            // 执行接口逻辑
            await chatHandler(req, res);
        } catch (err) {
            console.error('路由执行异常：', err);
            res.writeHead(500, {
                'Content-Type': 'application/json;charset=utf-8'
            });
            res.end(JSON.stringify({
                code: 500,
                msg: '请求处理失败：' + err.message
            }));
        }
        return;
    }

    // 兜底404
    res.writeHead(404, {
        'Content-Type': 'text/plain;charset=utf-8'
    });
    res.end('404 Not Found');
});

// 启动监听
server.listen(PORT, () => {
    console.log(`✅ 服务启动成功，正在监听端口：${PORT}`);
});
