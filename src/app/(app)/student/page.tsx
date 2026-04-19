import { addDays } from "date-fns";
import Link from "next/link";
import { Bookmark, CircleAlert, ShieldCheck, Sparkles } from "lucide-react";

import { DateNavigator } from "@/components/shared/date-navigator";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDateParam, formatDayLabel, formatTimeRange, parseDateParam } from "@/lib/date";
import { requireRole } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type StudentHomePageProps = {
  searchParams?: Promise<{
    date?: string | string[];
  }>;
};

export default async function StudentHomePage({
  searchParams,
}: StudentHomePageProps) {
  const session = await requireRole(["STUDENT", "ADMIN"]);

  if (!session.user.studentProfileId) {
    return null;
  }

  const params = (await searchParams) ?? {};
  const rawDate = typeof params.date === "string" ? params.date : undefined;
  const selectedDate = parseDateParam(rawDate);
  const nextDay = addDays(selectedDate, 1);

  const student = await db.studentProfile.findUnique({
    where: { id: session.user.studentProfileId },
    include: {
      user: true,
      group: true,
      dutyBookings: {
        where: { status: "ACTIVE" },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!student) {
    return null;
  }

  const [lessonDay, selectedAssignments] = await Promise.all([
    db.lessonDay.findFirst({
      where: {
        groupId: student.groupId,
        date: {
          gte: selectedDate,
          lt: nextDay,
        },
      },
      include: {
        lessonPairs: {
          orderBy: { pairNumber: "asc" },
        },
      },
    }),
    db.dutyAssignment.findMany({
      where: {
        assignedStudentId: student.id,
        date: {
          gte: selectedDate,
          lt: nextDay,
        },
      },
      include: {
        cleaningComplexity: true,
        relatedLessonPair: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="student"
        title={`Мой день: ${student.group.name}`}
        description={`Пары и мои назначения на ${formatDayLabel(selectedDate)}.`}
        actions={
          <>
            <DateNavigator basePath="/student" currentDate={selectedDate} />
            <Link
              href={`/student/schedule?date=${formatDateParam(selectedDate)}`}
              className={cn(buttonVariants({ variant: "default" }), "rounded-2xl")}
            >
              Неделя группы
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Баланс"
          value={student.currentDutyScore}
          hint={student.currentDutyScore >= 0 ? "Рабочий статус" : "Нужно выровнять баланс"}
          trend={student.currentDutyScore >= 0 ? "up" : "down"}
          icon={ShieldCheck}
          tone={student.currentDutyScore >= 0 ? "teal" : "rose"}
        />
        <MetricCard
          label="Дежурств"
          value={student.totalDuties}
          hint="За все время"
          icon={Sparkles}
          tone="blue"
        />
        <MetricCard
          label="Штрафов"
          value={student.totalPenalties}
          hint="С учетом истории"
          icon={CircleAlert}
          tone="amber"
        />
        <MetricCard
          label="Активные брони"
          value={student.dutyBookings.length}
          hint="Текущие заявки"
          icon={Bookmark}
          tone="teal"
        />
      </div>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Пары на {formatDayLabel(selectedDate)}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {lessonDay?.lessonPairs.length ? (
            lessonDay.lessonPairs.map((pair) => (
              <div key={pair.id} className="rounded-2xl border border-border/60 p-4">
                <div className="font-medium">
                  {pair.pairNumber}. {pair.subject}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatTimeRange(pair.startTime, pair.endTime)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">На эту дату пары не найдены.</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Мои дежурства на {formatDayLabel(selectedDate)}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {selectedAssignments.length ? (
            selectedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 p-4"
              >
                <div>
                  <div className="font-medium">{assignment.cleaningComplexity.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.relatedLessonPair
                      ? `Пара ${assignment.relatedLessonPair.pairNumber}: ${assignment.relatedLessonPair.subject}`
                      : "Дежурство на весь учебный день"}
                  </div>
                </div>
                <StatusBadge status={assignment.status} />
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              На выбранную дату назначений нет.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
