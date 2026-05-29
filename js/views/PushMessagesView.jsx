const { Box, Typography, Chip, Tabs, Tab, TextField, IconButton } = MaterialUI;
const { useState, useEffect, useMemo, useCallback } = React;

function PushMessagesView() {
    const [messages, setMessages] = useState([]);
    const [tab, setTab] = useState('all');
    // 地区过滤（仅浏览器本地生效）
    var _a = useState(function () {
        try { return localStorage.getItem('dashboard_region') || ''; }
        catch (e) { return ''; }
    }), region = _a[0], setRegion = _a[1];

    var latest = messages.length > 0 ? messages[0] : null;

    useEffect(function () {
        var store = window.DashboardData.getStore();
        setMessages(store.pushMessages.slice(0, 100));

        var unsub = window.DashboardData.addListener(function (s) {
            setMessages(s.pushMessages.slice(0, 100));
        });
        return unsub;
    }, []);

    // 持久化地区设置
    var handleRegionChange = useCallback(function (e) {
        var v = e.target.value;
        setRegion(v);
        try { localStorage.setItem('dashboard_region', v); } catch (err) {}
    }, []);

    var clearRegion = useCallback(function () {
        setRegion('');
        try { localStorage.setItem('dashboard_region', ''); } catch (err) {}
    }, []);

    // 地区筛选 + 分类筛选
    var filtered = useMemo(function () {
        var list = messages;
        // 地区过滤
        var kw = region.trim();
        if (kw) {
            list = list.filter(function (m) {
                return (m.text || '').indexOf(kw) >= 0;
            });
        }
        // 分类过滤
        if (tab !== 'all') {
            list = list.filter(function (m) {
                var t = String(m.event_type || '').toLowerCase();
                if (tab === 'earthquake') return t.indexOf('earthquake') >= 0 || t.indexOf('地震') >= 0;
                if (tab === 'tsunami') return t.indexOf('tsunami') >= 0 || t.indexOf('海啸') >= 0;
                if (tab === 'weather') return t.indexOf('weather') >= 0 || t.indexOf('气象') >= 0;
                if (tab === 'other') return !(t.indexOf('earthquake') >= 0 || t.indexOf('地震') >= 0 || t.indexOf('tsunami') >= 0 || t.indexOf('海啸') >= 0 || t.indexOf('weather') >= 0 || t.indexOf('气象') >= 0);
                return true;
            });
        }
        return list;
    }, [messages, tab, region]);

    // 分类统计（不受地区限制）
    var stats = useMemo(function () {
        var all = 0, eq = 0, ts = 0, wx = 0, other = 0;
        messages.forEach(function (m) {
            all++;
            var t = String(m.event_type || '').toLowerCase();
            if (t.indexOf('earthquake') >= 0 || t.indexOf('地震') >= 0) eq++;
            else if (t.indexOf('tsunami') >= 0 || t.indexOf('海啸') >= 0) ts++;
            else if (t.indexOf('weather') >= 0 || t.indexOf('气象') >= 0) wx++;
            else other++;
        });
        return { all: all, earthquake: eq, tsunami: ts, weather: wx, other: other };
    }, [messages]);

    function classifyType(type) {
        if (!type) return 'other';
        var t = String(type).toLowerCase();
        if (t.indexOf('earthquake') >= 0 || t.indexOf('地震') >= 0) return 'earthquake';
        if (t.indexOf('tsunami') >= 0 || t.indexOf('海啸') >= 0) return 'tsunami';
        if (t.indexOf('weather') >= 0 || t.indexOf('气象') >= 0) return 'weather';
        return 'other';
    }

    function renderChip(type) {
        var cat = classifyType(type);
        var labelMap = { earthquake: '地震', tsunami: '海啸', weather: '气象', other: '通知' };
        return React.createElement(Chip, { label: labelMap[cat], size: 'small', className: 'push-chip push-chip--' + cat });
    }

    function renderItem(msg, idx, isPinned) {
        var cat = classifyType(msg.event_type);
        return React.createElement(
            'div', { key: idx, className: 'push-item push-item--' + cat + (isPinned ? ' push-item--pinned' : '') },
            React.createElement('div', { className: 'push-item__bar' }),
            React.createElement(
                'div', { className: 'push-item__body' },
                isPinned && React.createElement('div', { className: 'push-pin-badge' }, '📌 最新'),
                React.createElement(
                    'div', { className: 'push-item__header' },
                    renderChip(msg.event_type),
                    msg.source && React.createElement(Typography, { variant: 'caption', className: 'push-item__source' }, msg.source),
                    React.createElement(Typography, { variant: 'caption', className: 'push-item__time' },
                        formatTimeWithZone(msg.timestamp || '', 'UTC+8', true))
                ),
                React.createElement(Typography, { variant: 'body2', className: 'push-item__text' }, msg.text)
            )
        );
    }

    if (messages.length === 0) {
        return React.createElement(
            Box, { className: 'push-empty' },
            React.createElement('div', { className: 'push-empty-icon' }, '📡'),
            React.createElement(Typography, { variant: 'h6', className: 'push-empty-title' }, '等待预警数据'),
            React.createElement(Typography, { variant: 'body2', color: 'textSecondary' }, '连接后端后将自动接收实时推送消息')
        );
    }

    return React.createElement(
        Box, { className: 'push-view' },
        // ── 置顶最新消息卡片 ──
        latest && React.createElement(
            Box, { className: 'push-pinned' },
            renderItem(latest, 'pinned', true)
        ),
        // ── 统计行 ──
        React.createElement(
            Box, { className: 'push-stats-row' },
            React.createElement('div', { className: 'push-stat-item', onClick: function () { setTab('all'); } },
                React.createElement('span', { className: 'push-stat-num' }, stats.all),
                React.createElement('span', { className: 'push-stat-label' }, '全部')),
            React.createElement('div', { className: 'push-stat-item push-stat-item--quake', onClick: function () { setTab('earthquake'); } },
                React.createElement('span', { className: 'push-stat-num' }, stats.earthquake),
                React.createElement('span', { className: 'push-stat-label' }, '地震')),
            React.createElement('div', { className: 'push-stat-item push-stat-item--tsunami', onClick: function () { setTab('tsunami'); } },
                React.createElement('span', { className: 'push-stat-num' }, stats.tsunami),
                React.createElement('span', { className: 'push-stat-label' }, '海啸')),
            React.createElement('div', { className: 'push-stat-item push-stat-item--weather', onClick: function () { setTab('weather'); } },
                React.createElement('span', { className: 'push-stat-num' }, stats.weather),
                React.createElement('span', { className: 'push-stat-label' }, '气象'))
        ),
        // ── 地区过滤 + 分类 Tabs ──
        React.createElement(
            Box, { className: 'push-toolbar' },
            React.createElement(
                Tabs, {
                    value: tab,
                    onChange: function (e, v) { setTab(v); },
                    className: 'push-tabs',
                    variant: 'scrollable',
                    scrollButtons: false,
                },
                React.createElement(Tab, { label: '全部', value: 'all' }),
                React.createElement(Tab, { label: '地震', value: 'earthquake' }),
                React.createElement(Tab, { label: '海啸', value: 'tsunami' }),
                React.createElement(Tab, { label: '气象', value: 'weather' }),
                React.createElement(Tab, { label: '其他', value: 'other' })
            ),
            React.createElement(
                Box, { className: 'push-region-filter' },
                React.createElement(TextField, {
                    size: 'small',
                    placeholder: '过滤地区…',
                    value: region,
                    onChange: handleRegionChange,
                    className: 'push-region-input',
                    InputProps: {
                        endAdornment: region
                            ? React.createElement(IconButton, { size: 'small', onClick: clearRegion, className: 'push-region-clear' }, '✕')
                            : null,
                    },
                })
            )
        ),
        // ── 消息列表 ──
        React.createElement(
            'div', { className: 'push-list' },
            filtered.length === 0
                ? React.createElement(Box, { className: 'push-empty-inline' },
                    React.createElement(Typography, { variant: 'body2', color: 'textSecondary' }, '暂无此类消息'))
                : filtered.map(function (msg, idx) { return renderItem(msg, idx, false); })
        )
    );
}
