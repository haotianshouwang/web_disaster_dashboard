/**
 * 历史灾害事件列表的多维过滤、分页查询与实时推送同步钩子。
 * 所有数据通过 DashboardData WebSocket 获取，不依赖 HTTP API。
 */
function useEventsQuery({ wsEvents, wsConnected, preserveScrollPosition }) {
    // 列表过滤与分页控制状态
    var _a = React.useState('all'), filterType = _a[0], setFilterType = _a[1];
    var _b = React.useState(1), currentPage = _b[0], setCurrentPage = _b[1];
    var _c = React.useState(0), totalPages = _c[0], setTotalPages = _c[1];
    var _d = React.useState(0), total = _d[0], setTotal = _d[1];
    var _e = React.useState([]), events = _e[0], setEvents = _e[1];
    var _f = React.useState(false), loading = _f[0], setLoading = _f[1];
    var _g = React.useState(50), pageSize = _g[0], setPageSize = _g[1];
    var _h = React.useState(200), maxPageSize = _h[0], setMaxPageSize = _h[1];
    var _i = React.useState(''), pageInput = _i[0], setPageInput = _i[1];
    var _j = React.useState('single'), sourceFilterMode = _j[0], setSourceFilterMode = _j[1];
    var _k = React.useState([]), selectedSources = _k[0], setSelectedSources = _k[1];
    var _l = React.useState([]), sourceOptions = _l[0], setSourceOptions = _l[1];
    var _m = React.useState('all'), magnitudeFilter = _m[0], setMagnitudeFilter = _m[1];
    var _n = React.useState('default'), magnitudeOrder = _n[0], setMagnitudeOrder = _n[1];
    var _o = React.useState(''), keyword = _o[0], setKeyword = _o[1];

    // 跨渲染周期的状态快照引用
    var filterTypeRef = React.useRef(filterType);
    var pageSizeRef = React.useRef(pageSize);
    var selectedSourcesRef = React.useRef(selectedSources);
    var currentPageRef = React.useRef(currentPage);
    var magnitudeFilterRef = React.useRef(magnitudeFilter);
    var magnitudeOrderRef = React.useRef(magnitudeOrder);
    var keywordRef = React.useRef(keyword);

    /**
     * 通过 WebSocket 查询事件
     */
    var fetchEvents = React.useCallback(function (page, type, limit, sources, minMagnitude, magnitudeSort, searchKeyword, levelFilter, options) {
        sources = sources || [];
        options = options || {};
        var safeLimit = Number(limit) > 0 ? Number(limit) : 50;
        var preserveScroll = Boolean(options.preserveScroll);
        var shouldToggleLoading = !preserveScroll;

        if (preserveScroll && typeof preserveScrollPosition === 'function') {
            preserveScrollPosition();
        }
        if (shouldToggleLoading) {
            setLoading(true);
        }

        // 构建后端参数
        var eventType = '';
        if (type === 'earthquake') eventType = 'earthquake';
        else if (type === 'weather') eventType = 'weather_alarm';
        else if (type === 'tsunami') eventType = 'tsunami';

        window.DashboardData.queryEvents({
            page: page,
            limit: safeLimit,
            event_type: eventType,
            sources: Array.isArray(sources) ? sources.join(',') : '',
            min_magnitude: minMagnitude !== null && minMagnitude !== undefined ? String(minMagnitude) : '',
            magnitude_order: magnitudeSort || '',
            keyword: searchKeyword || '',
            level_filter: levelFilter || '',
        }).then(function (data) {
            var dataEvents = Array.isArray(data.events) ? data.events : [];
            setEvents(dataEvents);
            setTotal(data.total || 0);
            setTotalPages(data.total_pages || 0);
            // 首次加载时用响应中的 events 构建 sourceOptions
            if (typeof data.events === 'object' && data.events.length > 0 && sourceOptions.length === 0) {
                var opts = [];
                var seen = {};
                for (var i = 0; i < data.events.length; i++) {
                    var src = data.events[i].source || data.events[i].source_id;
                    if (src && !seen[src]) {
                        seen[src] = true;
                        opts.push({ source_value: src, source_label: src });
                    }
                }
                if (opts.length > 0) setSourceOptions(opts);
            }
            if (shouldToggleLoading) setLoading(false);
        }).catch(function (err) {
            if (String(err.message || '').indexOf('timeout') >= 0) {
                // WS 重连期间超时正常，静默忽略
            } else {
                console.error('Failed to fetch events:', err);
            }
            if (shouldToggleLoading) setLoading(false);
        });
    }, [preserveScrollPosition]);

    // 预加载数据源选项（使用初始化快照中的 events）
    React.useEffect(function () {
        var store = window.DashboardData.getStore();
        if (store.events && store.events.length > 0 && sourceOptions.length === 0) {
            var opts = [];
            var seen = {};
            for (var i = 0; i < store.events.length && i < 100; i++) {
                var src = store.events[i].source || store.events[i].source_id;
                if (src && !seen[src]) {
                    seen[src] = true;
                    opts.push({ source_value: src, source_label: src });
                }
            }
            if (opts.length > 0) setSourceOptions(opts);
        }
    }, []);

    // 监听过滤参数变化
    React.useEffect(function () {
        setCurrentPage(1);
        setPageInput('');
        var usesLevelFilter = filterType === 'weather' || filterType === 'tsunami';
        var minMag = usesLevelFilter || magnitudeFilter === 'all' ? null : Number(magnitudeFilter);
        var lvlFilter = usesLevelFilter && magnitudeFilter !== 'all' ? magnitudeFilter : '';
        var magSort = usesLevelFilter || magnitudeOrder === 'default' ? '' : magnitudeOrder;
        fetchEvents(1, filterType, pageSize, selectedSources, minMag, magSort, keyword, lvlFilter);
    }, [filterType, pageSize, selectedSources, magnitudeFilter, magnitudeOrder, keyword, fetchEvents]);

    React.useEffect(function () {
        if (pageSize > maxPageSize) setPageSize(maxPageSize);
    }, [pageSize, maxPageSize]);

    // 同步状态引用
    React.useEffect(function () {
        filterTypeRef.current = filterType;
        pageSizeRef.current = pageSize;
        selectedSourcesRef.current = selectedSources;
        currentPageRef.current = currentPage;
        magnitudeFilterRef.current = magnitudeFilter;
        magnitudeOrderRef.current = magnitudeOrder;
        keywordRef.current = keyword;
    });

    // WebSocket 实时推送：收到新事件时静默刷新
    React.useEffect(function () {
        if (!wsConnected) return;
        var curFilter = filterTypeRef.current;
        var usesLevel = curFilter === 'weather' || curFilter === 'tsunami';
        var minMag = usesLevel || magnitudeFilterRef.current === 'all' ? null : Number(magnitudeFilterRef.current);
        var lvl = usesLevel && magnitudeFilterRef.current !== 'all' ? magnitudeFilterRef.current : '';
        var magSort = usesLevel || magnitudeOrderRef.current === 'default' ? '' : magnitudeOrderRef.current;
        fetchEvents(
            currentPageRef.current, curFilter, pageSizeRef.current,
            selectedSourcesRef.current, minMag, magSort,
            keywordRef.current, lvl,
            { preserveScroll: true }
        );
    }, [wsEvents, wsConnected, fetchEvents]);

    var goToPage = React.useCallback(function (targetPage) {
        if (totalPages <= 0) return;
        var safePage = Math.max(1, Math.min(totalPages, targetPage));
        if (safePage === currentPage) return;
        setCurrentPage(safePage);
        setPageInput('');
        var usesLevel = filterType === 'weather' || filterType === 'tsunami';
        var minMag = usesLevel || magnitudeFilter === 'all' ? null : Number(magnitudeFilter);
        var lvl = usesLevel && magnitudeFilter !== 'all' ? magnitudeFilter : '';
        var magSort = usesLevel || magnitudeOrder === 'default' ? '' : magnitudeOrder;
        fetchEvents(safePage, filterType, pageSize, selectedSources, minMag, magSort, keyword, lvl);
    }, [currentPage, totalPages, fetchEvents, filterType, pageSize, selectedSources, magnitudeFilter, magnitudeOrder, keyword]);

    return {
        filterType: filterType, setFilterType: setFilterType,
        currentPage: currentPage, setCurrentPage: setCurrentPage,
        totalPages: totalPages, total: total,
        events: events, loading: loading,
        pageSize: pageSize, setPageSize: setPageSize,
        maxPageSize: maxPageSize,
        pageInput: pageInput, setPageInput: setPageInput,
        sourceFilterMode: sourceFilterMode, setSourceFilterMode: setSourceFilterMode,
        selectedSources: selectedSources, setSelectedSources: setSelectedSources,
        sourceOptions: sourceOptions,
        magnitudeFilter: magnitudeFilter, setMagnitudeFilter: setMagnitudeFilter,
        magnitudeOrder: magnitudeOrder, setMagnitudeOrder: setMagnitudeOrder,
        keyword: keyword, setKeyword: setKeyword,
        fetchEvents: fetchEvents,
        goToPage: goToPage,
    };
}
