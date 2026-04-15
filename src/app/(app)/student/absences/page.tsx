import { db } from "@/lib/db";
import { AbsenceRequestForm } from "@/components/forms/absence-request-form";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { getStudentAbsenceRequests } from "@/modules/attendance/service";

export default async function StudentAbsencesPage() {
  const session = await requireRole(["STUDENT", "ADMIN"]);

  if (!session.user.studentProfileId || !session.user.primaryGroupId) {
    return null;
  }

  const [reasons, day, requests] = await Promise.all([
    db.absenceReason.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    db.lessonDay.findFirst({
      where: {
        groupId: session.user.primaryGroupId,
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
    }),
    getStudentAbsenceRequests(session.user.studentProfileId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="student"
        title="Сообщить об отсутствии"
        description="Отметьте отсутствие на день или конкретную пару и сразу отправьте причину."
      />
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Новая заявка</CardTitle>
        </CardHeader>
        <CardContent>
          <AbsenceRequestForm
            groupId={session.user.primaryGroupId}
            studentId={session.user.studentProfileId}
            reasons={reasons.map((reason) => ({ id: reason.id, label: reason.label }))}
            lessonOptions={
              day?.lessonPairs.map((pair) => ({
                id: pair.id,
                label: `${pair.pairNumber}. ${pair.subject}`,
              })) ?? []
            }
          />
        </CardContent>
      </Card>
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Мои заявки</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-border/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{request.reason.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {request.date.toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <StatusBadge status={request.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
