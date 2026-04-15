import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { formatShortDate } from "@/lib/date";
import { getDutyJournal } from "@/modules/duties/service";

export default async function ManagerDutyLogPage() {
  const session = await requireRole(MANAGER_ROLES);

  if (!session.user.primaryGroupId) {
    return null;
  }

  const journal = await getDutyJournal(session.user.primaryGroupId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="duties"
        title="Журнал дежурств"
        description="История назначений, замен и исходов по группе."
      />
      <div className="grid gap-3">
        {journal.map((entry) => (
          <Card key={entry.id} className="border-border/60 shadow-none">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{entry.assignedStudent.user.fullName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatShortDate(entry.date)} -{" "}
                    {entry.relatedLessonPair
                      ? `пара ${entry.relatedLessonPair.pairNumber}: ${entry.relatedLessonPair.subject}`
                      : "весь учебный день"}{" "}
                    - {entry.cleaningComplexity.label}
                  </div>
                </div>
                <StatusBadge status={entry.status} />
              </div>
              {entry.evaluation?.comment ? (
                <div className="text-sm text-muted-foreground">{entry.evaluation.comment}</div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
