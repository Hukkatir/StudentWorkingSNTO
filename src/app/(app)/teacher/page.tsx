import { TeacherEvaluationForm } from "@/components/duties/teacher-evaluation-form";
import { DateNavigator } from "@/components/shared/date-navigator";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TEACHING_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDayLabel, parseDateParam } from "@/lib/date";
import { getTeacherAssignmentsForDay } from "@/modules/duties/service";
import { getGroupStudents } from "@/modules/students/service";

type TeacherDayPageProps = {
  searchParams?: Promise<{
    date?: string | string[];
  }>;
};

export default async function TeacherDayPage({
  searchParams,
}: TeacherDayPageProps) {
  const session = await requireRole(TEACHING_ROLES);
  const params = (await searchParams) ?? {};
  const rawDate = typeof params.date === "string" ? params.date : undefined;
  const selectedDate = parseDateParam(rawDate);
  const assignments = await getTeacherAssignmentsForDay(session.user.id, selectedDate);

  const studentMaps = new Map<string, Awaited<ReturnType<typeof getGroupStudents>>>(
    await Promise.all(
      [...new Set(assignments.map((assignment) => assignment.groupId))].map(
        async (groupId): Promise<[string, Awaited<ReturnType<typeof getGroupStudents>>]> => [
          groupId,
          await getGroupStudents(groupId),
        ],
      ),
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="teacher"
        title={`Оценка дежурств на ${formatDayLabel(selectedDate)}`}
        description="Можно перейти на любой учебный день и проверить все назначенные дежурства по своим группам."
        actions={<DateNavigator basePath="/teacher" currentDate={selectedDate} />}
      />

      <div className="grid gap-4">
        {assignments.length ? (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="border-border/60 shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{assignment.group.name}</CardTitle>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {assignment.assignedStudent.user.fullName} - {assignment.cleaningComplexity.label}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {assignment.relatedLessonPair
                        ? `Пара ${assignment.relatedLessonPair.pairNumber}: ${assignment.relatedLessonPair.subject}`
                        : "Дежурство на весь учебный день"}
                    </div>
                  </div>
                  <StatusBadge status={assignment.status} />
                </div>
              </CardHeader>
              <CardContent>
                {assignment.evaluation ? (
                  <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                    Оценка за это дежурство уже сохранена.
                  </div>
                ) : (
                  <TeacherEvaluationForm
                    assignmentId={assignment.id}
                    replacementCandidates={(studentMaps.get(assignment.groupId) ?? []).map(
                      (student) => ({
                        id: student.id,
                        fullName: student.user.fullName,
                      }),
                    )}
                  />
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-border/60 shadow-none">
            <CardContent className="p-6 text-sm text-muted-foreground">
              На выбранную дату дежурств для оценки нет. Можно перейти на предыдущий или следующий
              день через навигатор сверху.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
