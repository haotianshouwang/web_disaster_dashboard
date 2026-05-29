(() => {
    /**
     * 仪表盘 WebSocket 数据管理器。
     * 所有数据（状态/统计/事件/趋势/热力图/推送消息）统一从 WebSocket 获取，
     * 不再依赖 HTTP API。
     */
    var store = {
        status: { running: false, uptime: '--', version: '-' },
        config: { displayTimezone: 'UTC+8' },
        statistics: {},
        events: [],
        trend: [],
        heatmap: [],
        pushMessages: [],
        dataLoaded: false,
        wsConnected: false,
        lastEvent: null,
    };

    var listeners = [];

    function notify() {
        var snapshot = Object.assign({}, store);
        listeners.forEach(function (fn) { try { fn(snapshot); } catch (e) {} });
    }

    function addListener(fn) {
        listeners.push(fn);
        return function () {
            listeners = listeners.filter(function (f) { return f !== fn; });
        };
    }

    function getStore() {
        return store;
    }

    // ── WebSocket 消息处理 ──

    function handleWsMessage(msg) {
        if (!msg || typeof msg !== 'object') return;
        var type = msg.type;
        var data = msg.data;

        switch (type) {
            case 'full_update':
            case 'update':
                if (data) {
                    if (data.status) store.status = data.status;
                    if (data.config) store.config = data.config;
                    if (data.statistics) store.statistics = data.statistics;
                    if (data.events !== undefined) store.events = data.events;
                    if (data.trend !== undefined) store.trend = data.trend;
                    if (data.heatmap !== undefined) store.heatmap = data.heatmap;
                    if (data.recent_messages) {
                        // 后端 deque 是旧→新顺序，反转为新→旧
                        store.pushMessages = data.recent_messages.slice().reverse();
                    }
                    store.dataLoaded = true;
                }
                store.wsConnected = true;
                notify();
                break;

            case 'event':
                if (data) {
                    if (data.status) store.status = data.status;
                    if (data.statistics) store.statistics = data.statistics;
                    if (data.events !== undefined) store.events = data.events;
                }
                if (msg.new_event) {
                    store.lastEvent = msg.new_event;
                }
                notify();
                break;

            case 'push_message':
                store.pushMessages.unshift(msg);
                if (store.pushMessages.length > 50) store.pushMessages.length = 50;
                notify();
                break;

            case 'events_result':
                // 事件查询结果由调用方通过 pendingQueries 自行消费
                break;

            case 'pong':
                break;
        }
    }

    // ── 事件查询（通过 WebSocket 请求/响应）──

    var pendingQueries = {};
    var queryIdCounter = 0;

    function queryEvents(params) {
        return new Promise(function (resolve, reject) {
            queryIdCounter += 1;
            var qid = 'q_' + queryIdCounter;
            pendingQueries[qid] = { resolve: resolve, reject: reject };

            var sendResult = window.WebSocketClient && window.WebSocketClient.send({
                type: 'query_events',
                qid: qid,
                page: params.page || 1,
                limit: params.limit || 50,
                event_type: params.event_type || '',
                sources: params.sources || '',
                min_magnitude: params.min_magnitude || '',
                magnitude_order: params.magnitude_order || '',
                keyword: params.keyword || '',
                level_filter: params.level_filter || '',
            });

            if (!sendResult) {
                delete pendingQueries[qid];
                // WebSocket 未连接时返回空数据，等连接后 snapshot 会推送数据
                resolve({ events: [], total: 0, total_pages: 0 });
                return;
            }

            // 超时
            setTimeout(function () {
                if (pendingQueries[qid]) {
                    delete pendingQueries[qid];
                    reject(new Error('Event query timeout'));
                }
            }, 15000);
        });
    }

    // 注册 WebSocket 监听器来接收 events_result
    var wsUnsubscribe = null;

    function init() {
        if (wsUnsubscribe) return;
        wsUnsubscribe = (window.WebSocketClient && window.WebSocketClient.subscribe({
            onConnected: function () {
                store.wsConnected = true;
                notify();
            },
            onDisconnected: function () {
                store.wsConnected = false;
                notify();
            },
            onMessage: function (msg) {
                // 先检查是否有等待中的查询
                if (msg && msg.type === 'events_result' && msg.qid && pendingQueries[msg.qid]) {
                    var pending = pendingQueries[msg.qid];
                    delete pendingQueries[msg.qid];
                    pending.resolve(msg.data || { events: [], total: 0, total_pages: 0 });
                }
                handleWsMessage(msg);
            },
        }));
    }

    window.DashboardData = {
        getStore: getStore,
        addListener: addListener,
        queryEvents: queryEvents,
        handleMessage: handleWsMessage,
        init: init,
    };
})();
