import Link from "next/link";
import { CalendarDays, ClipboardList, Sparkles, Users } from "lucide-react";

import { DateNavigator } from "@/components/shared/date-navigator";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDateParam, formatDayLabel, formatTimeRange, parseDateParam } from "@/lib/date";
import { cn } from "@/lib/utils";
import { getGroupDashboard } from "@/modules/groups/service";

type ManagerDashboardPageProps = {
  searchParams?: Promise<{
    date?: string | string[];
  }>;
};

export default async function ManagerDashboardPage({
  searchParams,
}: ManagerDashboardPageProps) {
  const session = await requireRole(MANAGER_ROLES);
  const groupId = session.user.primaryGroupId;

  if (!groupId) {
    return null;
  }

  const params = (await searchParams) ?? {};
  const rawDate = typeof params.date === "string" ? params.date : undefined;
  const selectedDate = parseDateParam(rawDate);
  const dashboard = await getGroupDashboard(groupId, selectedDate);

  const overviewCards = [
    {
      label: "Студентов в группе",
      value: dashboard.group?.studentProfiles.length ?? 0,
      hint: "Состав группы",
      icon: Users,
      tone:
        "bg-[linear-gradient(180deg,rgba(0,136,130,0.08),transparent_72%)] dark:bg-[linear-gradient(180deg,rgba(0,136,130,0.16),transparent_72%)]",
    },
    {
      label: "Пар на день",
      value: dashboard.today?.lessonPairs.length ?? 0,
      hint: dashboard.today ? "Расписание загружено" : "На эту дату занятий нет",
      icon: CalendarDays,
      tone:
        "bg-[linear-gradient(180deg,rgba(20,56,122,0.08),transparent_72%)] dark:bg-[linear-gradient(180deg,rgba(122,167,255,0.14),transparent_72%)]",
    },
    {
      label: "Плановые отсутствия",
      value: dashboard.absenceRequests,
      hint: dashboard.absenceRequests ? "Есть заявки на дату" : "Заявок нет",
      icon: ClipboardList,
      tone:
        "bg-[linear-gradient(180deg,rgba(0,136,130,0.05),rgba(20,56,122,0.04)_88%,transparent)] dark:bg-[linear-gradient(180deg,rgba(0,136,130,0.10),rgba(122,167,255,0.08)_88%,transparent)]",
    },
    {
      label: "Брони дежурств",
      value: dashboard.bookings,
      hint: dashboard.bookings ? "Есть активные брони" : "Брони не оформлены",
      icon: Sparkles,
      tone:
        "bg-[linear-gradient(180deg,rgba(0,136,130,0.10),transparent_72%)] dark:bg-[linear-gradient(180deg,rgba(0,136,130,0.18),transparent_72%)]",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="group manager"
        title={
          dashboard.group
            ? `${dashboard.group.name}: ${formatDayLabel(selectedDate)}`
            : `Рабочий день на ${formatDayLabel(selectedDate)}`
        }
        actions={
          <>
            <DateNavigator basePath="/manager" currentDate={selectedDate} />
            <Link
              href={`/manager/schedule?date=${formatDateParam(selectedDate)}`}
              className={cn(buttonVariants({ variant: "default" }), "rounded-2xl")}
            >
              Расписание недели
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={cn(
                "relative overflow-hidden rounded-[1.8rem] border border-border/70 bg-card p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.34)]",
                item.tone,
              )}
            >
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative flex h-full flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="text-4xl font-semibold tracking-tight">{item.value}</div>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/15 bg-background/80 text-primary shadow-sm">
                    <Icon className="size-5" />
                  </div>
                </div>
                <div className="mt-auto inline-flex w-fit rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {item.hint}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Пары на {formatDayLabel(selectedDate)}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {dashboard.today?.lessonPairs.length ? (
            dashboard.today.lessonPairs.map((pair) => (
              <Link
                key={pair.id}
                href={`/manager/attendance/${pair.id}`}
                className="rounded-2xl border border-border/60 bg-background/80 p-4 transition-colors hover:bg-muted/60"
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
            <div className="text-sm text-muted-foreground">На эту дату пары не найдены.</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Дежурные на {formatDayLabel(selectedDate)}</CardTitle>
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
                        : "Дежурство на весь учебный день"}{" "}
                      · {assignment.cleaningComplexity.label}
                    </div>
                  </div>
                  <StatusBadge status={assignment.status} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              На выбранную дату дежурные еще не назначены.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
