import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { TEACHING_ROLES } from "@/lib/auth/permissions";
import { formatShortDate } from "@/lib/date";

export default async function TeacherEvaluationsPage() {
  const session = await requireRole(TEACHING_ROLES);
  const teacherProfile = await db.teacherProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!teacherProfile) {
    return null;
  }

  const evaluations = await db.cleaningEvaluation.findMany({
    where: { teacherId: teacherProfile.id },
    include: {
      dutyAssignment: {
        include: {
          assignedStudent: {
            include: { user: true },
          },
          group: true,
          relatedLessonPair: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="teacher"
        title="Журнал оценок"
        description="История выставленных оценок и нарушений по уборке."
      />
      <div className="grid gap-3">
        {evaluations.map((evaluation) => (
          <Card key={evaluation.id} className="border-border/60 shadow-none">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {evaluation.dutyAssignment.group.name} -{" "}
                    {evaluation.dutyAssignment.assignedStudent.user.fullName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatShortDate(evaluation.createdAt)} -{" "}
                    {evaluation.dutyAssignment.relatedLessonPair
                      ? `пара ${evaluation.dutyAssignment.relatedLessonPair.pairNumber}: ${evaluation.dutyAssignment.relatedLessonPair.subject}`
                      : "дежурство на весь день"}
                  </div>
                </div>
                <StatusBadge status={evaluation.quality} />
              </div>
              {evaluation.comment ? (
                <div className="text-sm text-muted-foreground">{evaluation.comment}</div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
