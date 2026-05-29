const { Box, Typography } = MaterialUI;
const { useState, useEffect } = React;

/**
 * 实时推送预览卡片（只读）
 * 展示最近 3 条预警推送消息
 */
function RecentPushesCard() {
    var _a = useState([]), items = _a[0], setItems = _a[1];

    useEffect(function () {
        var update = function () {
            var s = window.DashboardData.getStore();
            setItems(s.pushMessages.slice(0, 4));
        };
        update();
        var unsub = window.DashboardData.addListener(function () { update(); });
        return unsub;
    }, []);

    if (items.length === 0) {
        return React.createElement(
            'div', { className: 'card' },
            React.createElement(
                Box, { className: 'status-card-header' },
                React.createElement('div', { className: 'status-card-icon status-card-icon--actions' }, '📢'),
                React.createElement(Typography, { variant: 'h6', className: 'status-card-title' }, '实时推送预览')
            ),
            React.createElement(
                Box, { p: 2, textAlign: 'center' },
                React.createElement(Typography, { variant: 'body2', color: 'textSecondary' }, '暂无推送消息')
            )
        );
    }

    function classify(type) {
        if (!type) return 'other';
        var t = String(type).toLowerCase();
        if (t.indexOf('earthquake') >= 0 || t.indexOf('地震') >= 0) return 'earthquake';
        if (t.indexOf('tsunami') >= 0 || t.indexOf('海啸') >= 0) return 'tsunami';
        if (t.indexOf('weather') >= 0 || t.indexOf('气象') >= 0) return 'weather';
        return 'other';
    }

    var colors = { earthquake: '#D32F2F', tsunami: '#01579B', weather: '#E65100', other: '#6750A4' };

    return React.createElement(
        'div', { className: 'card recent-pushes-card' },
        React.createElement(
            Box, { className: 'status-card-header' },
            React.createElement('div', { className: 'status-card-icon status-card-icon--actions' }, '📢'),
            React.createElement(Typography, { variant: 'h6', className: 'status-card-title' }, '实时推送预览')
        ),
        React.createElement(
            Box, { className: 'recent-pushes-list' },
            items.map(function (msg, idx) {
                var cat = classify(msg.event_type);
                var text = String(msg.text || '').replace(/\n/g, ' ').substring(0, 60);
                if (String(msg.text || '').length > 60) text += '...';
                return React.createElement(
                    'div', { key: idx, className: 'recent-push-row' },
                    React.createElement('div', { className: 'recent-push-dot', style: { background: colors[cat] } }),
                    React.createElement(
                        'div', { className: 'recent-push-content' },
                        React.createElement(Typography, { variant: 'caption', className: 'recent-push-time' },
                            formatTimeWithZone(msg.timestamp || '', 'UTC+8', true)),
                        React.createElement(Typography, { variant: 'body2', className: 'recent-push-text' },
                            text)
                    )
                );
            })
        )
    );
}
