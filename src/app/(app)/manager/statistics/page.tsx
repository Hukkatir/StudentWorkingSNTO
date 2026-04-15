import { GroupStatisticsCharts } from "@/components/statistics/group-statistics-charts";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { getGroupStatistics } from "@/modules/statistics/service";

export default async function ManagerStatisticsPage() {
  const session = await requireRole(MANAGER_ROLES);

  if (!session.user.primaryGroupId) {
    return null;
  }

  const statistics = await getGroupStatistics(session.user.primaryGroupId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="analytics"
        title="Статистика группы"
        description="Дежурства, баланс баллов, красная зона и распределение штрафов/бонусов."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Студентов" value={statistics.summary.studentCount} />
        <MetricCard label="Красная зона" value={statistics.summary.redZoneCount} />
        <MetricCard label="Всего дежурств" value={statistics.summary.totalCompletedDuties} />
        <MetricCard label="Сумма штрафов" value={statistics.summary.totalPenalties} />
      </div>
      <GroupStatisticsCharts
        dutyChart={statistics.dutyChart}
        pointsChart={statistics.pointsChart}
      />
      <div className="grid gap-3">
        {statistics.rows.map((row) => (
          <Card key={row.studentId} className="border-border/60 shadow-none">
            <CardContent className="grid gap-3 p-4 md:grid-cols-[1.4fr_repeat(5,1fr)] md:items-center">
              <div className="font-medium">{row.fullName}</div>
              <div>
                <div className="text-xs text-muted-foreground">Дежурств</div>
                <div className="font-medium">{row.completedDuties}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Назначений</div>
                <div className="font-medium">{row.assignedCount}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Отказов</div>
                <div className="font-medium">{row.refusalCount}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Побегов</div>
                <div className="font-medium">{row.escapeCount}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Баланс</div>
                <div className="font-medium">{row.currentBalance}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
