import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getAuditLogEntries } from "@/modules/admin/service";

export default async function AdminAuditPage() {
  const entries = await getAuditLogEntries();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title="Журнал действий"
        description="Все критичные изменения проходят через журнал аудита и остаются доступны для проверки."
      />
      <div className="grid gap-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="border-border/60 shadow-none">
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <span>{entry.action}</span>
                <span>•</span>
                <span>{entry.entityType}</span>
              </div>
              <div className="font-medium">{entry.entityId}</div>
              <div className="text-sm text-muted-foreground">
                {entry.actorUser?.fullName ?? "Система"} • {entry.createdAt.toLocaleString("ru-RU")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
