import Link from "next/link";
import {
  ClipboardList,
  GraduationCap,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SCHEDULE_ADAPTER_LABELS,
  SCHEDULE_IMPORT_STATUS_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
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
        actions={
          <>
            <Link
              href="/admin/groups"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Новая группа
            </Link>
            <Link
              href="/admin/students"
              className={cn(buttonVariants({ variant: "default" }), "rounded-2xl")}
            >
              Новый студент
            </Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <MetricCard
          label="Активные группы"
          value={dashboard.groups}
          hint="Рабочие потоки"
          icon={Users}
          tone="teal"
        />
        <MetricCard
          label="Студенты"
          value={dashboard.students}
          hint="Все учетные записи"
          icon={UserRound}
          tone="blue"
        />
        <MetricCard
          label="Преподаватели"
          value={dashboard.teachers}
          hint="Подключены к системе"
          icon={GraduationCap}
          tone="amber"
        />
        <MetricCard
          label="Всего назначений"
          value={dashboard.dutyAssignments}
          hint="По всем группам"
          icon={Sparkles}
          tone="teal"
        />
        <MetricCard
          label="Заявки на отсутствие"
          value={dashboard.pendingAbsenceRequests}
          hint={
            dashboard.pendingAbsenceRequests > 0 ? "Ожидают проверки" : "Новых заявок нет"
          }
          trend={dashboard.pendingAbsenceRequests > 0 ? "down" : "neutral"}
          icon={ClipboardList}
          tone={dashboard.pendingAbsenceRequests > 0 ? "rose" : "blue"}
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
                  {SCHEDULE_ADAPTER_LABELS[item.adapterKey] ?? item.adapterKey} · {item.itemCount}{" "}
                  записей
                </div>
              </div>
              <div className="text-sm font-medium text-teal-700 dark:text-teal-300">
                {SCHEDULE_IMPORT_STATUS_LABELS[item.status]}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
