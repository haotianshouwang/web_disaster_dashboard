const { Box, Typography, IconButton, Button } = MaterialUI;
const { useState, useEffect } = React;

/**
 * 实时时钟子组件 (RealTimeClock)
 */
function RealTimeClock({ timeZone }) {
    const [timeStr, setTimeStr] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const formatted = formatTimeWithZone(now.toISOString(), timeZone || 'UTC+8', true);
            const seconds = String(now.getSeconds()).padStart(2, '0');
            setTimeStr(`${formatted}:${seconds}`);
        };

        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, [timeZone]);

    if (!timeStr) return null;

    return (
        <div className="real-time-clock">
            <span className="real-time-clock__label">当前时间 🕒</span>
            <span className="real-time-clock__value">{timeStr}</span>
        </div>
    );
}

/**
 * 页头组件 (Header)
 */
function Header({ currentView }) {
    const { state, dispatch } = useAppContext();
    const { config, dataLoaded } = state;
    const displayTimezone = config.displayTimezone || 'UTC+8';

    const toggleTheme = () => {
        dispatch({ type: 'TOGGLE_THEME' });
    };

    const currentViewDefinition = window.ViewRegistry.getViewDefinition(currentView);

    // 获取管理端地址
    const adminUrl = (function () {
        var base = window.__API_BASE_URL__;
        if (base && typeof base === 'string') return base.replace(/\/+$/, '');
        return window.location.origin;
    })();

    return (
        <>
            {!dataLoaded && (
                <div className="app-loading-progress">
                    <div className="app-loading-progress__bar"></div>
                </div>
            )}
            <div className="top-bar">
                <Typography variant="h5" className="header-title">
                    {currentViewDefinition.title}
                </Typography>

                <Box className="header-actions">
                    <RealTimeClock timeZone={displayTimezone} />

                    <div className={`ws-status-chip ${state.wsConnected ? 'is-connected' : 'is-disconnected'}`}>
                        <div className="ws-status-chip__dot"></div>
                        <Typography variant="body2" className="ws-status-chip__label">
                            {state.wsConnected ? '已连接' : '未连接'}
                        </Typography>
                    </div>

                    {/* 登录管理端按钮：跳转到后端管理页面 */}
                    <Button
                        variant="outlined"
                        size="small"
                        className="admin-login-btn"
                        onClick={() => window.open(adminUrl, '_blank')}
                        title="跳转到后端管理端进行配置管理"
                    >
                        🔧 登录管理端
                    </Button>

                    <IconButton onClick={toggleTheme} className="theme-toggle-button">
                        <span className="theme-toggle-button__icon">
                            {state.theme === 'dark' ? '🌞' : '🌙'}
                        </span>
                    </IconButton>
                </Box>
            </div>
        </>
    );
}
