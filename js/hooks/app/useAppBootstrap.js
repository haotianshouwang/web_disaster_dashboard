/**
 * 应用冷启动数据初始化钩子。
 * 通过 DashboardData（WebSocket）获取初始快照，不再依赖 HTTP API。
 */
function useAppBootstrap({ applySnapshot }) {
    React.useEffect(function () {
        // 初始化 DashboardData，订阅 WebSocket 消息
        window.DashboardData.init();

        // 注册监听器，收到快照时注入全局状态
        var unsub = window.DashboardData.addListener(function (snapshot) {
            applySnapshot(snapshot);
        });

        return function () { unsub(); };
    }, [applySnapshot]);
}
