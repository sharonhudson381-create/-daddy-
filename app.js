const express = require('express');
const app = express();

// CORS全局跨域放行，解决手机浏览器拦截接口
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-password');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 接收大体积图片base64，限制10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 托管前端静态页面（index.html、css、前端js）
app.use(express.static(__dirname));

// 挂载对话接口
app.post('/api/chat', require('./api/chat'));

// 你原本的 /api/history 相关路由继续放在这里即可
module.exports = app;
