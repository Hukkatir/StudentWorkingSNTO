import { DutyPlanner } from "@/components/duties/duty-planner";
import { DateNavigator } from "@/components/shared/date-navigator";
import { PageHeader } from "@/components/shared/page-header";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDayLabel, parseDateParam } from "@/lib/date";
import { calculateDutyCandidates, getDutyPlanningData } from "@/modules/duties/service";
import { getGroupStudents } from "@/modules/students/service";

type ManagerDutiesPageProps = {
  searchParams?: Promise<{
    date?: string | string[];
  }>;
};

export default async function ManagerDutiesPage({
  searchParams,
}: ManagerDutiesPageProps) {
  const session = await requireRole(MANAGER_ROLES);
  const groupId = session.user.primaryGroupId;

  if (!groupId) {
    return null;
  }

  const params = (await searchParams) ?? {};
  const rawDate = typeof params.date === "string" ? params.date : undefined;
  const selectedDate = parseDateParam(rawDate);

  const [planning, roster, candidates] = await Promise.all([
    getDutyPlanningData(groupId, selectedDate),
    getGroupStudents(groupId),
    calculateDutyCandidates(groupId, selectedDate, 2, "MODERATE", null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="duties"
        title={`Назначение дежурств на ${formatDayLabel(selectedDate)}`}
        description="Выберите день, затем весь учебный день или конкретную пару, и система покажет подходящих кандидатов."
        actions={<DateNavigator basePath="/manager/duties" currentDate={selectedDate} />}
      />

      <DutyPlanner
        groupId={groupId}
        date={selectedDate.toISOString()}
        complexities={planning.complexities.map((complexity) => ({
          code: complexity.code,
          label: complexity.label,
        }))}
        lessonPairs={planning.lessonPairs.map((lessonPair) => ({
          id: lessonPair.id,
          pairNumber: lessonPair.pairNumber,
          subject: lessonPair.subject,
          startTime: lessonPair.startTime,
          endTime: lessonPair.endTime,
        }))}
        roster={roster.map((student) => ({
          id: student.id,
          fullName: student.user.fullName,
          currentDutyScore: student.currentDutyScore,
          totalDuties: student.totalDuties,
        }))}
        initialCandidates={candidates.allCandidates}
        assignments={planning.assignments.map((assignment) => ({
          id: assignment.id,
          fullName: assignment.assignedStudent.user.fullName,
          status: assignment.status,
          complexityLabel: assignment.cleaningComplexity.label,
          targetLabel: assignment.relatedLessonPair
            ? `Пара ${assignment.relatedLessonPair.pairNumber}: ${assignment.relatedLessonPair.subject}`
            : "Весь учебный день",
          hasEvaluation: Boolean(assignment.evaluation),
        }))}
      />
    </div>
  );
}
