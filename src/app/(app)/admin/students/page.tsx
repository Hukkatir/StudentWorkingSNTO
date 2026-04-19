import { StudentCreateDialogButton } from "@/components/admin/student-create-dialog-button";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAdminGroups, listAdminStudents } from "@/modules/admin/service";

export default async function AdminStudentsPage() {
  const [students, groups] = await Promise.all([listAdminStudents(), listAdminGroups()]);
  const groupOptions = groups.map((group) => ({ id: group.id, name: group.name }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title="Студенты"
        actions={<StudentCreateDialogButton groups={groupOptions} />}
      />

      <Card className="overflow-hidden border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.92)),radial-gradient(circle_at_top_right,rgba(0,136,130,0.12),transparent_34%)] shadow-none dark:bg-[linear-gradient(180deg,rgba(19,33,31,0.98),rgba(15,25,24,0.96)),radial-gradient(circle_at_top_right,rgba(0,136,130,0.16),transparent_34%)]">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Каталог студентов</CardTitle>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Всего: {students.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {students.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[260px] pl-4">Студент</TableHead>
                    <TableHead className="min-w-[140px]">Группа</TableHead>
                    <TableHead className="min-w-[120px]">Статус</TableHead>
                    <TableHead className="min-w-[100px]">Баланс</TableHead>
                    <TableHead className="min-w-[100px]">Дежурств</TableHead>
                    <TableHead className="min-w-[100px] pr-4">Штрафов</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="pl-4 align-top">
                        <div className="flex min-w-[240px] flex-col gap-1 whitespace-normal">
                          <span className="font-medium">{student.user.fullName}</span>
                          <span className="text-sm text-muted-foreground">
                            {student.user.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Логин: {student.user.login}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">{student.group.name}</TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant="secondary"
                          className={
                            student.user.active
                              ? "rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "rounded-full"
                          }
                        >
                          {student.user.active ? "Активен" : "Отключен"}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <span
                          className={
                            student.currentDutyScore < 0
                              ? "font-semibold text-rose-600 dark:text-rose-300"
                              : "font-semibold text-emerald-700 dark:text-emerald-300"
                          }
                        >
                          {student.currentDutyScore}
                        </span>
                      </TableCell>
                      <TableCell className="align-top">{student.totalDuties}</TableCell>
                      <TableCell className="pr-4 align-top">{student.totalPenalties}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-sm text-muted-foreground">
              Студенты еще не добавлены. Создайте первую запись через кнопку вверху страницы.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
