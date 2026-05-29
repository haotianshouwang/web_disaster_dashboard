const { Box, Typography } = MaterialUI;

/**
 * 仪表盘侧边栏导航组件 (Sidebar)
 *
 * @param {Object} props 组件属性
 * @param {string} props.currentView 当前所处视图的唯一标识符
 * @param {Function} props.onViewChange 视图切换回调，接收目标视图 ID
 */
function Sidebar({ currentView, onViewChange }) {
    const { state } = useAppContext();

    // 挂载全局调试状态
    window.__DISASTER_APP_STATE__ = state;

    // 从全局视图注册表中获取导航菜单项
    const menuItems = window.ViewRegistry.getNavigationItems();

    return (
        <div className="sidebar">
            {/* 品牌标识区块 */}
            <div className="sidebar-header">
                <img src="logo.png" alt="Logo" className="sidebar-logo-img" />
                <div>
                    <Typography variant="h6" className="sidebar-brand-title">
                        灾害预警
                    </Typography>
                    <Typography variant="caption" className="sidebar-brand-subtitle">
                        Dashboard
                    </Typography>
                </div>
            </div>

            {/* 动态导航菜单列表 */}
            <Box className="sidebar-nav">
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => onViewChange(item.id)}
                    >
                        <span className="nav-item__icon">{item.icon}</span>
                        <Typography variant="body2" className="nav-item__label">
                            {item.label}
                        </Typography>
                    </div>
                ))}
            </Box>
        </div>
    );
}
