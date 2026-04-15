import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { listAdminGroups } from "@/modules/admin/service";

export default async function AdminGroupsPage() {
  const groups = await listAdminGroups();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title="Группы"
        description="Справочник групп с быстрым обзором наполнения и активности."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="border-border/60 shadow-none">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{group.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Курс {group.course}, поток {group.year}
                  </div>
                </div>
                <div className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700">
                  {group.active ? "Активна" : "Архив"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-muted/70 p-3">
                  <div className="text-xs text-muted-foreground">Студенты</div>
                  <div className="mt-1 text-xl font-semibold">
                    {group._count.studentProfiles}
                  </div>
                </div>
                <div className="rounded-2xl bg-muted/70 p-3">
                  <div className="text-xs text-muted-foreground">Учебные дни</div>
                  <div className="mt-1 text-xl font-semibold">{group._count.lessonDays}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
