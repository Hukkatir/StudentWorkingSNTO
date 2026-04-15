import { db } from "@/lib/db";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { formatDayLabel, formatTimeRange } from "@/lib/date";

export default async function StudentHomePage() {
  const session = await requireRole(["STUDENT", "ADMIN"]);

  if (!session.user.studentProfileId) {
    return null;
  }

  const student = await db.studentProfile.findUnique({
    where: { id: session.user.studentProfileId },
    include: {
      user: true,
      group: true,
      dutyBookings: {
        where: { status: "ACTIVE" },
        orderBy: { date: "asc" },
      },
      pointTransactions: true,
    },
  });

  if (!student) {
    return null;
  }

  const lessonDay = await db.lessonDay.findFirst({
    where: {
      groupId: student.groupId,
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    include: {
      lessonPairs: {
        orderBy: { pairNumber: "asc" },
      },
    },
    orderBy: { date: "asc" },
  });

  const latestAssignment = await db.dutyAssignment.findFirst({
    where: { assignedStudentId: student.id },
    include: {
      cleaningComplexity: true,
      relatedLessonPair: true,
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="student"
        title={`Мой день: ${student.group.name}`}
        description="Быстрый доступ к парам, броням и личному балансу по дежурствам."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Баланс" value={student.currentDutyScore} />
        <MetricCard label="Дежурств" value={student.totalDuties} />
        <MetricCard label="Штрафов" value={student.totalPenalties} />
        <MetricCard label="Активные брони" value={student.dutyBookings.length} />
      </div>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Мои пары</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {lessonDay?.lessonPairs.length ? (
            lessonDay.lessonPairs.map((pair) => (
              <div key={pair.id} className="rounded-2xl border border-border/60 p-4">
                <div className="font-medium">
                  {pair.pairNumber}. {pair.subject}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDayLabel(lessonDay.date)} - {formatTimeRange(pair.startTime, pair.endTime)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">На сегодня пары не найдены.</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Последнее назначение</CardTitle>
        </CardHeader>
        <CardContent>
          {latestAssignment ? (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 p-4">
              <div>
                <div className="font-medium">{formatDayLabel(latestAssignment.date)}</div>
                <div className="text-sm text-muted-foreground">
                  {latestAssignment.relatedLessonPair
                    ? `Пара ${latestAssignment.relatedLessonPair.pairNumber}: ${latestAssignment.relatedLessonPair.subject}`
                    : "Дежурство на весь день"}{" "}
                  - {latestAssignment.cleaningComplexity.label}
                </div>
              </div>
              <StatusBadge status={latestAssignment.status} />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Назначений еще не было.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
