import Link from "next/link";

import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { formatDayLabel, formatTimeRange } from "@/lib/date";
import { getGroupDashboard } from "@/modules/groups/service";
import { cn } from "@/lib/utils";

export default async function ManagerDashboardPage() {
  const session = await requireRole(MANAGER_ROLES);
  const groupId = session.user.primaryGroupId;

  if (!groupId) {
    return null;
  }

  const dashboard = await getGroupDashboard(groupId, new Date());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="group manager"
        title={dashboard.group ? `${dashboard.group.name}: рабочий день` : "Рабочий день группы"}
        description="Отсюда удобно открыть текущие пары, внести посещаемость и посмотреть назначенных дежурных."
        actions={
          <Link href="/manager/duties" className={cn(buttonVariants({ variant: "default" }))}>
            Открыть дежурства
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Студенты в группе" value={dashboard.group?.studentProfiles.length ?? 0} />
        <MetricCard label="Пары сегодня" value={dashboard.today?.lessonPairs.length ?? 0} />
        <MetricCard label="Плановые отсутствия" value={dashboard.absenceRequests} />
        <MetricCard label="Брони дежурств" value={dashboard.bookings} />
      </div>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Пары на сегодня</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {dashboard.today?.lessonPairs.length ? (
            dashboard.today.lessonPairs.map((pair) => (
              <Link
                key={pair.id}
                href={`/manager/attendance/${pair.id}`}
                className="rounded-2xl border border-border/60 p-4 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {pair.pairNumber}. {pair.subject}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimeRange(pair.startTime, pair.endTime)}
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Открыть
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">На сегодня пары не найдены.</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Дежурные на {formatDayLabel(new Date())}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {dashboard.assignments.length > 0 ? (
            dashboard.assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-2xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{assignment.assignedStudent.user.fullName}</div>
                    <div className="text-sm text-muted-foreground">
                      {assignment.relatedLessonPair
                        ? `Пара ${assignment.relatedLessonPair.pairNumber}: ${assignment.relatedLessonPair.subject}`
                        : "Весь учебный день"}{" "}
                      - {assignment.cleaningComplexity.label}
                    </div>
                  </div>
                  <StatusBadge status={assignment.status} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              На сегодня дежурные еще не назначены.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
