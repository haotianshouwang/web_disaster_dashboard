/**
 * 重大灾害事件列表拉取与监听钩子。
 * 数据通过 DashboardData WebSocket 获取。
 */
function useMajorEvents(displayLimit, refreshSignal) {
    var limit = typeof displayLimit === 'number' && displayLimit > 0 ? displayLimit : 50;
    var _a = React.useState([]), majorEvents = _a[0], setMajorEvents = _a[1];
    var _b = React.useState(false), loading = _b[0], setLoading = _b[1];

    var fetchFromStore = React.useCallback(function () {
        var store = window.DashboardData.getStore();
        var all = store.events || [];
        // 过滤重大事件：高震级(>=5) 或 红色/橙色预警
        var filtered = all.filter(function (evt) {
            var mag = parseFloat(evt.magnitude);
            if (mag >= 5) return true;
            var lvl = String(evt.level || '').toLowerCase();
            if (lvl === '红色' || lvl === 'red' || lvl === '橙色' || lvl === 'orange') return true;
            return false;
        });
        // 取前 N 条
        var latest = filtered.slice(0, limit);
        setMajorEvents(function (prev) {
            if (prev.length === latest.length && prev.every(function (evt, idx) {
                return (evt.id || evt.event_id) === (latest[idx].id || latest[idx].event_id);
            })) {
                return prev;
            }
            return latest;
        });
        setLoading(false);
    }, [limit]);

    // 首次加载
    React.useEffect(function () {
        setLoading(true);
        fetchFromStore();
        var unsub = window.DashboardData.addListener(function () { fetchFromStore(); });
        return unsub;
    }, [fetchFromStore]);

    // 外部刷新信号
    React.useEffect(function () {
        fetchFromStore();
    }, [refreshSignal, fetchFromStore]);

    return {
        majorEvents: majorEvents,
        loading: loading,
        refreshMajorEvents: fetchFromStore,
    };
}

window.useMajorEvents = useMajorEvents;
