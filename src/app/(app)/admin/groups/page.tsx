import { FolderKanban, Layers3, Users } from "lucide-react";

import { GroupCreateDialogButton } from "@/components/admin/group-create-dialog-button";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listAdminGroups } from "@/modules/admin/service";

export default async function AdminGroupsPage() {
  const groups = await listAdminGroups();
  const activeGroups = groups.filter((group) => group.active).length;
  const archivedGroups = groups.length - activeGroups;
  const totalStudents = groups.reduce((sum, group) => sum + group._count.studentProfiles, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title="Группы"
        description="Каталог учебных групп с быстрым доступом к составу и текущей активности."
        actions={<GroupCreateDialogButton />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Всего групп"
          value={groups.length}
          hint="Каталог системы"
          icon={FolderKanban}
          tone="teal"
        />
        <MetricCard
          label="Активные"
          value={activeGroups}
          hint="Участвуют в работе"
          icon={Layers3}
          tone="blue"
        />
        <MetricCard
          label="Студентов в системе"
          value={totalStudents}
          hint="Во всех группах"
          icon={Users}
          tone="amber"
        />
      </div>

      {groups.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="overflow-hidden border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.88)),radial-gradient(circle_at_top_right,rgba(0,136,130,0.12),transparent_34%)] shadow-none dark:bg-[linear-gradient(180deg,rgba(19,33,31,0.98),rgba(15,25,24,0.96)),radial-gradient(circle_at_top_right,rgba(0,136,130,0.16),transparent_34%)]"
            >
              <CardContent className="flex h-full flex-col gap-5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {group.department || "Учебная группа"}
                    </div>
                    <div>
                      <div className="text-xl font-semibold tracking-tight">{group.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Курс {group.course} · набор {group.year}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      group.active
                        ? "rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "rounded-full"
                    }
                  >
                    {group.active ? "Активна" : "Архив"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Студенты
                    </div>
                    <div className="mt-2 text-3xl font-semibold">
                      {group._count.studentProfiles}
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Учебные дни
                    </div>
                    <div className="mt-2 text-3xl font-semibold">{group._count.lessonDays}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/70 shadow-none">
          <CardContent className="p-8 text-sm text-muted-foreground">
            Группы еще не добавлены. Создайте первую группу через кнопку вверху страницы.
          </CardContent>
        </Card>
      )}

      {archivedGroups > 0 ? (
        <div className="text-sm text-muted-foreground">
          В архиве сейчас {archivedGroups} {archivedGroups === 1 ? "группа" : "группы"}.
        </div>
      ) : null}
    </div>
  );
}
