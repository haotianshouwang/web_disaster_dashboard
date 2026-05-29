/**
 * 灾害预警仪表盘 — 后端连接配置
 *
 * 仪表盘前端独立运行时，通过此文件配置要连接的后端地址。
 *
 * 配置项说明：
 *   __API_BASE_URL__   — HTTP API 基础地址（如 http://127.0.0.1:8089）
 *   __WS_BASE_URL__    — WebSocket 基础地址（可选，默认从 __API_BASE_URL__ 推导）
 *   __DASHBOARD_KEY__  — 仪表盘连接密钥（需与后端 dashboard.key 一致，留空则不鉴权）
 *
 * 运行方式：
 *   1. 修改下方 __API_BASE_URL__ 为你的后端地址
 *   2. 如果后端设置了 dashboard.key，填入 __DASHBOARD_KEY__
 *   3. 用任意静态服务器托管此目录，如：
 *        npx serve .
 *        python -m http.server 3000
 */
(function () {
    // ▼▼▼ 修改此处为你的后端地址 ▼▼▼
    window.__API_BASE_URL__ = 'http://127.0.0.1:8089';

    // ▼▼▼ 如果后端设置了仪表盘连接密钥，取消注释并填入 ▼▼▼
    // window.__DASHBOARD_KEY__ = '';
})();
