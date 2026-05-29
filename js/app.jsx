/**
 * 仪表盘单页应用根入口
 * 全部数据通过 WebSocket DashboardData 获取，纯只读
 */

const { ThemeProvider, CssBaseline } = MaterialUI;
const { useMemo } = React;

function App() {
    const { state } = useAppContext();

    window.__DISASTER_APP_STATE__ = state;

    const { currentView, setCurrentView } = usePersistedViewState('currentView', 'pushmsgs');

    const mainContentRef = useMainScrollMemory({
        currentView,
        restoreTriggers: [state.events, state.stats],
    });

    useWebSocket();
    useBootloaderDismiss();

    const theme = useMemo(function () { return window.createAppTheme(state.theme); }, [state.theme]);

    function renderView() {
        var def = window.ViewRegistry.getViewDefinition(currentView);
        return def.component({});
    }

    return React.createElement(
        ThemeProvider, { theme: theme },
        React.createElement(CssBaseline, null),
        React.createElement(
            'div', { className: 'app' },
            React.createElement(Sidebar, { currentView: currentView, onViewChange: setCurrentView }),
            React.createElement(
                'div', { className: 'main-wrapper' },
                React.createElement(Header, { currentView: currentView }),
                React.createElement('div', { className: 'main-content', ref: mainContentRef }, renderView())
            )
        )
    );
}

function AuthWrapper() {
    var ready = useAuthReadyState();
    if (!ready) return null;
    return React.createElement(
        AppProvider, null,
        React.createElement(ToastProvider, null, React.createElement(App, null))
    );
}

if (!window.__DISASTER_WEBUI_INITIALIZED) {
    window.__DISASTER_WEBUI_INITIALIZED = true;
    var root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(AuthWrapper, null));
}
