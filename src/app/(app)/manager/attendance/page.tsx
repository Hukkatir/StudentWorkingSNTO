import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { formatTimeRange } from "@/lib/date";
import { getAttendanceDayOverview } from "@/modules/attendance/service";

export default async function ManagerAttendancePage() {
  const session = await requireRole(MANAGER_ROLES);

  if (!session.user.primaryGroupId) {
    return null;
  }

  const day = await getAttendanceDayOverview(session.user.primaryGroupId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="attendance"
        title="Посещаемость на сегодня"
        description="Откройте нужную пару и отметьте присутствие в мобильном списке."
      />
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Пары текущего дня</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {day?.lessonPairs.map((pair) => (
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
          )) ?? <div className="text-sm text-muted-foreground">Пары на сегодня отсутствуют.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
