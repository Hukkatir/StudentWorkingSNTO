import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { listAdminStudents } from "@/modules/admin/service";

export default async function AdminStudentsPage() {
  const students = await listAdminStudents();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title="Студенты"
        description="Поиск и быстрый контроль ролей, группы и текущего баланса."
      />
      <div className="grid gap-3">
        {students.map((student) => (
          <Card key={student.id} className="border-border/60 shadow-none">
            <CardContent className="grid gap-3 p-4 md:grid-cols-[1.4fr_repeat(4,1fr)] md:items-center">
              <div>
                <div className="font-medium">{student.user.fullName}</div>
                <div className="text-sm text-muted-foreground">{student.user.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Группа</div>
                <div className="font-medium">{student.group.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Баланс</div>
                <div className="font-medium">{student.currentDutyScore}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Дежурств</div>
                <div className="font-medium">{student.totalDuties}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Штрафы</div>
                <div className="font-medium">{student.totalPenalties}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
