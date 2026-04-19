import Link from "next/link";

import { DateNavigator } from "@/components/shared/date-navigator";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDayLabel, formatTimeRange, parseDateParam } from "@/lib/date";
import { getAttendanceDayOverview } from "@/modules/attendance/service";

type ManagerAttendancePageProps = {
  searchParams?: Promise<{
    date?: string | string[];
  }>;
};

export default async function ManagerAttendancePage({
  searchParams,
}: ManagerAttendancePageProps) {
  const session = await requireRole(MANAGER_ROLES);

  if (!session.user.primaryGroupId) {
    return null;
  }

  const params = (await searchParams) ?? {};
  const rawDate = typeof params.date === "string" ? params.date : undefined;
  const selectedDate = parseDateParam(rawDate);
  const day = await getAttendanceDayOverview(session.user.primaryGroupId, selectedDate);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="attendance"
        title={`Посещаемость на ${formatDayLabel(selectedDate)}`}
        description="Откройте нужную пару на выбранную дату и отметьте присутствие в удобном списке."
        actions={<DateNavigator basePath="/manager/attendance" currentDate={selectedDate} />}
      />
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Пары выбранного дня</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {day?.lessonPairs.length ? (
            day.lessonPairs.map((pair) => (
              <Link
                key={pair.id}
                href={`/manager/attendance/${pair.id}`}
                className="rounded-2xl border border-border/60 p-4 transition-colors hover:bg-muted/60"
              >
                <div className="font-medium">
                  {pair.pairNumber}. {pair.subject}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatTimeRange(pair.startTime, pair.endTime)}
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              На эту дату пары отсутствуют.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
