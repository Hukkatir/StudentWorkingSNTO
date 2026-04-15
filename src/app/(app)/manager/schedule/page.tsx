import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { formatDayLabel, formatTimeRange } from "@/lib/date";
import { getWeeklySchedule } from "@/modules/groups/service";

export default async function ManagerSchedulePage() {
  const session = await requireRole(MANAGER_ROLES);

  if (!session.user.primaryGroupId) {
    return null;
  }

  const days = await getWeeklySchedule(session.user.primaryGroupId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="group manager"
        title="Расписание на неделю"
        description="Импортированное расписание разложено по учебным дням и готово к использованию."
      />
      <div className="grid gap-4">
        {days.map((day) => (
          <Card key={day.id} className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle>{formatDayLabel(day.date)}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {day.lessonPairs.map((pair) => (
                <div key={pair.id} className="rounded-2xl border border-border/60 p-4">
                  <div className="font-medium">
                    {pair.pairNumber}. {pair.subject}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTimeRange(pair.startTime, pair.endTime)} • {pair.teacherName}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
