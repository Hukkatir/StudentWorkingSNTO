import { DateNavigator } from "@/components/shared/date-navigator";
import { PageHeader } from "@/components/shared/page-header";
import { WeeklyScheduleBoard } from "@/components/shared/weekly-schedule-board";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatWeekRange, parseDateParam } from "@/lib/date";
import { getWeeklySchedule } from "@/modules/groups/service";

type StudentSchedulePageProps = {
  searchParams?: Promise<{
    date?: string | string[];
  }>;
};

export default async function StudentSchedulePage({
  searchParams,
}: StudentSchedulePageProps) {
  const session = await requireRole(["STUDENT", "ADMIN"]);

  if (!session.user.studentProfileId) {
    return null;
  }

  const student = await db.studentProfile.findUnique({
    where: { id: session.user.studentProfileId },
    include: {
      group: true,
    },
  });

  if (!student) {
    return null;
  }

  const params = (await searchParams) ?? {};
  const rawDate = typeof params.date === "string" ? params.date : undefined;
  const selectedDate = parseDateParam(rawDate);
  const days = await getWeeklySchedule(student.groupId, selectedDate);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="student"
        title={`${student.group.name}: расписание недели`}
        description={`Неделя ${formatWeekRange(selectedDate)}. Можно быстро листать прошлые и будущие учебные дни.`}
        actions={
          <DateNavigator
            basePath="/student/schedule"
            currentDate={selectedDate}
            mode="week"
          />
        }
      />
      <WeeklyScheduleBoard
        days={days}
        emptyMessage="На выбранную неделю пары не найдены."
      />
    </div>
  );
}
