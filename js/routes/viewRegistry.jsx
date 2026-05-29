(() => {
    const VIEW_REGISTRY = [
        {
            id: 'pushmsgs',
            label: '实时推送',
            icon: '📢',
            title: '实时信息推送',
            component: () => <PushMessagesView />,
        },
        {
            id: 'status',
            label: '运行状态',
            icon: '📊',
            title: '运行状态',
            component: () => <StatusView />,
        },
        {
            id: 'events',
            label: '事件列表',
            icon: '📋',
            title: '事件列表',
            component: () => <EventsView />,
        },
        {
            id: 'stats',
            label: '数据统计',
            icon: '📈',
            title: '数据统计',
            component: () => <StatsView />,
        },
    ];

    function getViewDefinition(viewId) {
        return VIEW_REGISTRY.find((item) => item.id === viewId) || VIEW_REGISTRY[0];
    }

    function getNavigationItems() {
        return VIEW_REGISTRY.map((item) => ({
            id: item.id,
            label: item.label,
            icon: item.icon,
            badge: item.badge,
        }));
    }

    window.ViewRegistry = {
        items: VIEW_REGISTRY,
        getViewDefinition,
        getNavigationItems,
    };
})();
