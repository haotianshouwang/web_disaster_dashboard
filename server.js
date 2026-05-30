/**
 * 灾害预警仪表盘 — 代理开发服务器
 *
 * 用途：前端只暴露一个端口（默认 3000），浏览器只需连前端。
 * 服务器内部把 /api/* 和 /dashboard/ws 转发到后端 127.0.0.1:8089。
 *
 * 架构：
 *   外网 ─► :3000 (本代理)
 *              │ 静态文件 → disaster_dashboard/
 *              │ /api/*     → http://127.0.0.1:8089
 *              │ /dashboard/ws → ws://127.0.0.1:8089 (WebSocket)
 *
 * 启动：node server.js
 * 或者：npm start
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:8089';

const app = express();

// ── HTTP API 代理 ──
app.use('/api', createProxyMiddleware({
    target: BACKEND,
    changeOrigin: true,
    onError(err, req, res) {
        console.error('[proxy] /api 代理失败:', err.message);
        res.status(502).json({ error: '后端不可达' });
    },
}));

// ── 安全防护：拦截服务端源文件访问 ──
app.use((req, res, next) => {
    const p = (req.path || '').toLowerCase();
    const blocked = ['.env', 'server.js', 'package.json', 'package-lock.json',
                     'node_modules', '.git', '.gitignore', 'README.md'];
    if (blocked.some(f => p === '/' + f || p.startsWith('/' + f + '/') || p.includes('/' + f))) {
        return res.status(404).send('Not Found');
    }
    next();
});

// ── 静态文件服务（仅前端资源，dotfiles 拒绝）──
app.use(express.static(__dirname, { index: 'index.html', dotfiles: 'deny' }));

// ── SPA fallback ──
app.get('*', (req, res) => {
    // 不让代理吞掉 /dashboard/ws 升级请求
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ── 启动 HTTP 服务器 ──
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  🚨 灾害预警仪表盘代理服务器');
    console.log(`  ├─ 前端地址 : http://0.0.0.0:${PORT}`);
    console.log(`  ├─ API 代理  : /api/* → ${BACKEND}`);
    console.log(`  └─ WS 代理   : /dashboard/ws → ${BACKEND.replace('http', 'ws')}`);
    console.log('');
});

// ── WebSocket 代理（升级请求）──
server.on('upgrade', (req, socket, head) => {
    if (req.url && req.url.startsWith('/dashboard/ws')) {
        const wsProxy = createProxyMiddleware({
            target: BACKEND,
            changeOrigin: true,
            ws: true,
        });
        try {
            wsProxy.upgrade(req, socket, head);
        } catch (e) {
            console.error('[proxy] WS升级失败:', e.message);
            socket.destroy();
        }
    } else {
        socket.destroy();
    }
});

// ── 优雅退出 ──
process.on('SIGINT', () => {
    console.log('\n[proxy] 正在关闭...');
    server.close(() => process.exit(0));
});
