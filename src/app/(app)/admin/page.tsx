import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SCHEDULE_ADAPTER_LABELS,
  SCHEDULE_IMPORT_STATUS_LABELS,
} from "@/lib/constants";
import { getAdminDashboardData } from "@/modules/admin/service";
import { listScheduleImports } from "@/modules/schedule/service";

export default async function AdminDashboardPage() {
  const [dashboard, imports] = await Promise.all([
    getAdminDashboardData(),
    listScheduleImports(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title="Операционный центр системы"
        description="Глобальная картина по группам, импорту расписания и критичным событиям."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Активные группы" value={dashboard.groups} />
        <MetricCard label="Студенты" value={dashboard.students} />
        <MetricCard label="Преподаватели" value={dashboard.teachers} />
        <MetricCard label="Всего назначений" value={dashboard.dutyAssignments} />
        <MetricCard
          label="Заявки на отсутствие"
          value={dashboard.pendingAbsenceRequests}
          hint="ожидают проверки"
          trend={dashboard.pendingAbsenceRequests > 0 ? "down" : "neutral"}
        />
      </div>
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Последние импорты расписания</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {imports.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-2xl border border-border/60 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-medium">{item.sourceFilename}</div>
                <div className="text-sm text-muted-foreground">
                  {SCHEDULE_ADAPTER_LABELS[item.adapterKey] ?? item.adapterKey} •{" "}
                  {item.itemCount} записей
                </div>
              </div>
              <div className="text-sm font-medium text-teal-700">
                {SCHEDULE_IMPORT_STATUS_LABELS[item.status]}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
