import { DutyPlanner } from "@/components/duties/duty-planner";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/session";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { calculateDutyCandidates, getDutyPlanningData } from "@/modules/duties/service";
import { getGroupStudents } from "@/modules/students/service";

export default async function ManagerDutiesPage() {
  const session = await requireRole(MANAGER_ROLES);
  const groupId = session.user.primaryGroupId;

  if (!groupId) {
    return null;
  }

  const [planning, roster, candidates] = await Promise.all([
    getDutyPlanningData(groupId),
    getGroupStudents(groupId),
    calculateDutyCandidates(groupId, new Date(), 2, "MODERATE", null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="duties"
        title="Назначение дежурных"
        description="Можно выбрать весь день или конкретную пару, увидеть объяснимый автоподбор и удалить ошибочно созданное назначение."
      />
      <DutyPlanner
        groupId={groupId}
        date={new Date().toISOString()}
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
