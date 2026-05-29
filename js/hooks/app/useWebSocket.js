const { useEffect, useRef } = React;

/**
 * WebSocket 连接钩子。
 * 仅处理连接状态和实时事件推送，数据快照由 DashboardData 统一管理。
 */
function useWebSocket() {
    var ref = useRef(null);

    ref.current = function (msg) {
        if (!msg || typeof msg !== 'object') return;
        // 实时灾害强预警通知
        if (msg.type === 'event' && msg.new_event) {
            var dispatch = window._dispatchRef && window._dispatchRef.current;
            if (dispatch) {
                dispatch({ type: window.AppActionTypes.ADD_EVENT, payload: msg.new_event });
            }
        }
    };

    useEffect(function () {
        var unsubscribe = window.WebSocketClient.subscribe({
            onConnected: function () {
                var d = window._dispatchRef && window._dispatchRef.current;
                if (d) d({ type: window.AppActionTypes.SET_WS_CONNECTED, payload: true });
            },
            onDisconnected: function () {
                var d = window._dispatchRef && window._dispatchRef.current;
                if (d) d({ type: window.AppActionTypes.SET_WS_CONNECTED, payload: false });
            },
            onMessage: function (msg) { ref.current(msg); },
        });
        return unsubscribe;
    }, []);

    return {
        sendMessage: window.WebSocketClient.send,
    };
}
