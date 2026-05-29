const { createContext, useContext, useReducer, useCallback } = React;

const AppContext = createContext();

function toStatusUpdate(data, previousVersion) {
    data = data || {};
    var statusUpdate = {
        running: data.running,
        activeConnections: data.active_connections || data.activeConnections || 0,
        totalConnections: data.total_connections || data.totalConnections || 0,
        uptime: data.uptime || '--',
        subSourceStatus: data.sub_source_status,
        eewQueryStatus: data.eew_query_status || null,
        version: data.version || previousVersion || '--',
    };
    if (data.start_time) {
        statusUpdate.startTime = new Date(data.start_time);
    }
    return statusUpdate;
}

function AppProvider({ children }) {
    var _a = useReducer(window.appReducer, window.initialAppState), state = _a[0], dispatch = _a[1];
    // 暴露 dispatch 供非 React 代码（DashboardData 监听器）使用
    window._dispatchRef = { current: dispatch };

    useThemeSync(state.theme);

    // 接收 WebSocket 快照数据并同步到全局状态
    var applySnapshot = useCallback(function (snapshot) {
        var s = snapshot;
        if (s.status) {
            dispatch({
                type: window.AppActionTypes.UPDATE_STATUS,
                payload: toStatusUpdate(s.status, state.status.version),
            });
            // connections（加工后的连接数据，含显示名称/子源状态）
            if (s.status.connections) {
                dispatch({
                    type: window.AppActionTypes.UPDATE_CONNECTIONS,
                    payload: s.status.connections,
                });
            }
        }
        if (s.config) {
            dispatch({
                type: window.AppActionTypes.UPDATE_CONFIG,
                payload: { displayTimezone: s.config.display_timezone || 'UTC+8' },
            });
        }
        if (s.statistics) {
            // statistics 已经是 StatsNormalizer 期望的嵌套格式，直接透传
            dispatch({ type: window.AppActionTypes.UPDATE_STATS, payload: s.statistics || {} });
        }
        if (s.wsConnected !== undefined) {
            dispatch({ type: window.AppActionTypes.SET_WS_CONNECTED, payload: s.wsConnected });
        }
    }, [state.status.version]);

    // 启动引导
    useAppBootstrap({ applySnapshot: applySnapshot });

    // 运行时长计时器
    useStatusUptimeEffect({
        running: state.status.running,
        startTime: state.status.startTime,
        dispatch: dispatch,
    });

    return React.createElement(
        AppContext.Provider,
        { value: { state: state, dispatch: dispatch } },
        children
    );
}

function useAppContext() {
    var context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
}

window.AppProvider = AppProvider;
window.useAppContext = useAppContext;
window.toStatusUpdate = toStatusUpdate;
