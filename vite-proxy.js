import express from 'express';
import proxyMiddleware from 'express-http-proxy';
import http from 'http';

const app = express();
const PORT = 5173;

// 代理所有请求到本地 Vite 开发服务器（绕过 Host 检查）
app.use('/', proxyMiddleware('http://localhost:5174', {
  proxyReqPathResolver: () => '/',
}));

const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Vite Proxy Server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Forwarding to http://localhost:5174`);
});
