const { Box, Typography, Chip, Tabs, Tab, TextField, IconButton } = MaterialUI;
const { useState, useEffect, useMemo, useCallback } = React;

function PushMessagesView() {
    const [messages, setMessages] = useState([]);
    const [tab, setTab] = useState('all');
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

    var handleRegionChange = useCallback(function (e) {
        var v = e.target.value;
        setRegion(v);
        try { localStorage.setItem('dashboard_region', v); } catch (err) {}
    }, []);

    var clearRegion = useCallback(function () {
        setRegion('');
        try { localStorage.setItem('dashboard_region', ''); } catch (err) {}
    }, []);

    // 解析图片URL — 兼容3种格式（从文本中）
    function parseImageUrlFromText(text) {
        if (!text) return null;
        var m = text.match(/\[图片\s*:\s*(https?:\/\/[^\s\[\]]+?)\]/i);
        if (m) return m[1];
        m = text.match(/报告图片\s*[：:]\s*\n?\s*(https?:\/\/[^\s\n]+)/i);
        if (m) return m[1];
        m = text.match(/\n(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg))\s*$/im);
        if (m) return m[1];
        return null;
    }

    // 获取消息的所有图片URL（优先从 images 数组，降级到文本解析）
    function getAllImageUrls(msg) {
        var urls = [];
        // 新版 images 数组
        var imgs = msg.images;
        if (imgs && Array.isArray(imgs) && imgs.length > 0) {
            imgs.forEach(function (img) {
                if (img.type === 'url' && img.data) {
                    urls.push(img.data);
                } else if (img.type === 'base64' && img.data) {
                    // 处理 data URI 或纯 base64
                    if (img.data.indexOf('data:') === 0) {
                        urls.push(img.data);
                    } else {
                        urls.push('data:image/png;base64,' + img.data);
                    }
                }
            });
        }
        // 降级：从文本解析
        if (urls.length === 0) {
            var parsed = parseImageUrlFromText(msg.text);
            if (parsed) urls.push(parsed);
        }
        return urls;
    }

    function cleanText(text) {
        if (!text) return '';
        return text
            .replace(/\[图片\s*:\s*https?:\/\/[^\]]+\]/gi, '')
            .replace(/报告图片\s*[：:]\s*\n?\s*https?:\/\/[^\s\n]+/gi, '')
            .replace(/\nhttps?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg)\s*$/gim, '')
            .trim();
    }

    // 打开新窗口展示详情
    function openDetail(msg) {
        var imgUrls = getAllImageUrls(msg);
        var clean = cleanText(msg.text);
        var type = classifyType(msg.event_type);
        var typeLabels = { earthquake: '地震', tsunami: '海啸', weather: '气象', other: '通知' };
        var colors = { earthquake: '#D32F2F', tsunami: '#01579B', weather: '#E65100', other: '#6750A4' };
        var imgHtml = '';
        imgUrls.forEach(function (url) {
            imgHtml += '<div class="img-wrap"><img src="' + url + '" alt="图片" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"></div>';
        });
        var w = window.open('', '_blank');
        if (!w) return;
        w.document.write(
            '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<meta name="referrer" content="no-referrer">' +
            '<title>灾害预警详情</title>' +
            '<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:700px;margin:24px auto;padding:0 16px;color:#1C1B1F;background:#FEF7FF;line-height:1.7}' +
            '.badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;color:#fff;background:' + (colors[type] || '#6750A4') + '}' +
            '.meta{color:#999;font-size:13px;margin:8px 0 16px}' +
            '.text{white-space:pre-wrap;word-break:break-word;font-size:15px;margin-bottom:20px}' +
            '.img-wrap{text-align:center;margin-top:16px}' +
            '.img-wrap img{max-width:100%;max-height:500px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.1)}' +
            '@media(prefers-color-scheme:dark){body{background:#141218;color:#E6E1E5}.meta{color:#CAC4D0}}</style></head><body>' +
            '<h2><span class="badge">' + (typeLabels[type] || '通知') + '</span></h2>' +
            '<div class="meta">' +
            (msg.source ? (msg.source + ' &middot; ') : '') +
            (formatTimeWithZone(msg.timestamp || '', 'UTC+8', true) || '') +
            '</div>' +
            '<div class="text">' + (clean || msg.text || '').replace(/\n/g, '<br>') + '</div>' +
            imgHtml +
            '</body></html>'
        );
        w.document.close();
    }

    var filtered = useMemo(function () {
        var list = messages;
        var kw = region.trim();
        if (kw) {
            list = list.filter(function (m) { return (m.text || '').indexOf(kw) >= 0; });
        }
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
        var m = { earthquake: '地震', tsunami: '海啸', weather: '气象', other: '通知' };
        return React.createElement(Chip, { label: m[cat], size: 'small', className: 'push-chip push-chip--' + cat });
    }

    function renderItem(msg, idx, isPinned) {
        var cat = classifyType(msg.event_type);
        var imgUrls = getAllImageUrls(msg);
        var hasImg = imgUrls.length > 0;
        var clean = cleanText(msg.text);

        return React.createElement(
            'div', {
                key: idx,
                className: 'push-item push-item--' + cat + (isPinned ? ' push-item--pinned' : '') + (hasImg ? ' push-item--has-img' : ''),
                onClick: function () { openDetail(msg); },
                style: { cursor: 'pointer' }
            },
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
                React.createElement(Typography, { variant: 'body2', className: 'push-item__text' }, clean),
                hasImg && React.createElement(
                    'div', { className: 'push-item__imgs' },
                    imgUrls.map(function (url, i) {
                        return React.createElement('img', { key: i, src: url, className: 'push-item__thumb', alt: '图片' });
                    })
                )
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
        latest && React.createElement(Box, { className: 'push-pinned' }, renderItem(latest, 'pinned', true)),
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
        React.createElement(
            Box, { className: 'push-toolbar' },
            React.createElement(Tabs, {
                value: tab, onChange: function (e, v) { setTab(v); },
                className: 'push-tabs', variant: 'scrollable', scrollButtons: false,
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
                    size: 'small', placeholder: '过滤地区…', value: region, onChange: handleRegionChange,
                    className: 'push-region-input',
                    InputProps: { endAdornment: region ? React.createElement(IconButton, { size: 'small', onClick: clearRegion }, '✕') : null }
                })
            )
        ),
        React.createElement(
            'div', { className: 'push-list' },
            filtered.length === 0
                ? React.createElement(Box, { className: 'push-empty-inline' },
                    React.createElement(Typography, { variant: 'body2', color: 'textSecondary' }, '暂无此类消息'))
                : filtered.map(function (msg, idx) { return renderItem(msg, idx, false); })
        )
    );
}
