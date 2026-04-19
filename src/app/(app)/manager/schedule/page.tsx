import { DateNavigator } from "@/components/shared/date-navigator";
import { PageHeader } from "@/components/shared/page-header";
import { WeeklyScheduleBoard } from "@/components/shared/weekly-schedule-board";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatWeekRange, parseDateParam } from "@/lib/date";
import { getWeeklySchedule } from "@/modules/groups/service";

type ManagerSchedulePageProps = {
  searchParams?: Promise<{
    date?: string | string[];
  }>;
};

export default async function ManagerSchedulePage({
  searchParams,
}: ManagerSchedulePageProps) {
  const session = await requireRole(MANAGER_ROLES);

  if (!session.user.primaryGroupId) {
    return null;
  }

  const params = (await searchParams) ?? {};
  const rawDate = typeof params.date === "string" ? params.date : undefined;
  const selectedDate = parseDateParam(rawDate);
  const days = await getWeeklySchedule(session.user.primaryGroupId, selectedDate);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="group manager"
        title="Расписание на неделю"
        description={`Неделя ${formatWeekRange(selectedDate)}.`}
        actions={
          <DateNavigator basePath="/manager/schedule" currentDate={selectedDate} mode="week" />
        }
      />
      <WeeklyScheduleBoard
        days={days}
        emptyMessage="На выбранную неделю пары не найдены."
      />
    </div>
  );
}
