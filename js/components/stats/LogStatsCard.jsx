const { Typography } = MaterialUI;

function LogStatsCard({ style }) {
    const { state } = useAppContext();
    const { stats } = state;

    const logStats = stats && stats.logStats ? stats.logStats : {};
    const hasLogStats = !!(stats && stats.logStats);

    const fileCount = Number(logStats.file_count) || 0;
    const maxCapacity = Number(logStats.max_total_capacity_mb) || 0;
    const usagePercent = Number(logStats.usage_percent) || 0;
    const fileSize = Number(logStats.file_size_mb) || 0;
    const startTime = (logStats.date_range && logStats.date_range.start) || '暂无记录';
    const endTime = (logStats.date_range && logStats.date_range.end) || '暂无记录';

    const usageTone = usagePercent > 90 ? 'danger' : (usagePercent > 70 ? 'warning' : 'normal');

    return (
        <div className="card log-stats-card" style={style}>
            <div className="chart-card-header log-stats-header">
                <div className="log-stats-header-title">
                    <span className="log-stats-header-icon">📝</span>
                    <Typography variant="h6">系统日志统计</Typography>
                </div>
            </div>

            {!hasLogStats && (
                <Typography variant="body2" className="log-stats-empty-text">
                    当前暂无日志统计数据，请等待日志文件生成后自动更新或开启日志记录功能。
                </Typography>
            )}

            <div className="log-stats-grid" style={{
                '--log-stats-progress-width': Math.min(usagePercent, 100) + '%',
                '--log-stats-progress-color': usageTone === 'danger' ? 'var(--md-sys-color-error, #F44336)' : (usageTone === 'warning' ? 'var(--md-sys-color-tertiary, #F9A825)' : 'var(--md-sys-color-primary)'),
                '--log-stats-status-color': usageTone === 'danger' ? 'var(--md-sys-color-error, #F44336)' : (usageTone === 'warning' ? 'var(--md-sys-color-tertiary, #FFC107)' : 'var(--md-sys-color-primary)'),
            }}>
                <div className="log-stats-panel log-stats-panel--wide">
                    <Typography variant="caption" className="log-stats-muted">统计时间范围</Typography>
                    <Typography variant="body2" className="log-stats-strong-text">
                        {startTime} <span className="log-stats-range-separator">~</span> {endTime}
                    </Typography>
                </div>
                <div className="log-stats-panel">
                    <Typography variant="caption" className="log-stats-muted">总条目</Typography>
                    <Typography variant="h6" className="log-stats-strong-heading">{logStats.total_entries || 0}</Typography>
                </div>
                <div className="log-stats-panel">
                    <Typography variant="caption" className="log-stats-muted">文件数量</Typography>
                    <Typography variant="h6" className="log-stats-strong-heading">{fileCount}</Typography>
                </div>
                <div className="log-stats-panel log-stats-panel--wide">
                    <div className="log-stats-storage-head">
                        <div className="log-stats-storage-status">
                            <div className="log-stats-status-dot"></div>
                            <Typography variant="caption" className="log-stats-muted">存储占用</Typography>
                            <Typography variant="caption" className="log-stats-percent-text">({usagePercent.toFixed(2)}%)</Typography>
                        </div>
                        <Typography variant="caption" className="log-stats-strong-caption">
                            {fileSize.toFixed(2)} MB / {maxCapacity > 0 ? maxCapacity.toFixed(0) : '-'} MB
                        </Typography>
                    </div>
                    <div className="log-stats-progress-track">
                        <div className="log-stats-progress-bar"></div>
                    </div>
                </div>
                <div className="log-stats-panel log-stats-panel--wide">
                    <Typography variant="caption" className="log-stats-muted">过滤统计</Typography>
                    <div className="log-stats-filter-list">
                        <div className="log-stats-filter-row">
                            <Typography variant="body2" className="log-stats-body-sm">心跳包过滤</Typography>
                            <Typography variant="body2" className="log-stats-value-text">{(logStats.filter_stats && logStats.filter_stats.heartbeat_filtered) || 0}</Typography>
                        </div>
                        <div className="log-stats-filter-row">
                            <Typography variant="body2" className="log-stats-body-sm">P2P节点过滤</Typography>
                            <Typography variant="body2" className="log-stats-value-text">{(logStats.filter_stats && logStats.filter_stats.p2p_areas_filtered) || 0}</Typography>
                        </div>
                        <div className="log-stats-filter-row">
                            <Typography variant="body2" className="log-stats-body-sm">重复事件过滤</Typography>
                            <Typography variant="body2" className="log-stats-value-text">{(logStats.filter_stats && logStats.filter_stats.duplicate_events_filtered) || 0}</Typography>
                        </div>
                        <div className="log-stats-filter-row">
                            <Typography variant="body2" className="log-stats-body-sm">连接状态过滤</Typography>
                            <Typography variant="body2" className="log-stats-value-text">{(logStats.filter_stats && logStats.filter_stats.connection_status_filtered) || 0}</Typography>
                        </div>
                        <div className="log-stats-filter-row log-stats-filter-row--total">
                            <Typography variant="body2" className="log-stats-body-sm log-stats-body-sm--strong">总计过滤</Typography>
                            <Typography variant="body2" className="log-stats-value-text log-stats-value-text--strong">{(logStats.filter_stats && logStats.filter_stats.total_filtered) || 0}</Typography>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
