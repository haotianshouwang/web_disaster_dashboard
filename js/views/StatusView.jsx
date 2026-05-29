/**
 * 系统健康与服务状态仪表盘视图（只读）
 * 全部数据通过 WebSocket DashboardData 获取
 */

const { Box } = MaterialUI;

function StatusView() {
    return (
        <Box>
            <div className="dashboard-grid">
                <div className="span-12">
                    <NewsTicker />
                </div>

                <div className="span-4">
                    <StatusCard />
                </div>

                <div className="span-4">
                    <StatsCard />
                </div>

                <div className="span-4">
                    <RecentPushesCard />
                </div>

                <div className="span-12">
                    <ConnectionsGrid />
                </div>

                <div className="span-12">
                    <EewStatusCard />
                </div>
            </div>
        </Box>
    );
}
