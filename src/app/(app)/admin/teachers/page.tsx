import { TeacherCreateDialogButton } from "@/components/admin/teacher-create-dialog-button";
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
import { listAdminTeachers } from "@/modules/admin/service";

export default async function AdminTeachersPage() {
  const teachers = await listAdminTeachers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title="Преподаватели"
        description="Добавляйте преподавателей, чтобы пары из расписания корректно связывались с их кабинетом и оценкой дежурств."
        actions={<TeacherCreateDialogButton />}
      />

      <Card className="overflow-hidden border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.92)),radial-gradient(circle_at_top_right,rgba(20,56,122,0.1),transparent_34%)] shadow-none dark:bg-[linear-gradient(180deg,rgba(19,33,31,0.98),rgba(15,25,24,0.96)),radial-gradient(circle_at_top_right,rgba(20,56,122,0.16),transparent_34%)]">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Каталог преподавателей</CardTitle>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Всего: {teachers.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {teachers.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[260px] pl-4">Преподаватель</TableHead>
                    <TableHead className="min-w-[180px]">Кафедра</TableHead>
                    <TableHead className="min-w-[160px]">Должность</TableHead>
                    <TableHead className="min-w-[120px]">Статус</TableHead>
                    <TableHead className="min-w-[110px]">Пар в системе</TableHead>
                    <TableHead className="min-w-[120px] pr-4">Оценок дежурств</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="pl-4 align-top">
                        <div className="flex min-w-[240px] flex-col gap-1 whitespace-normal">
                          <span className="font-medium">{teacher.user.fullName}</span>
                          <span className="text-sm text-muted-foreground">{teacher.user.email}</span>
                          <span className="text-xs text-muted-foreground">
                            Логин: {teacher.user.login}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {teacher.department || (
                          <span className="text-sm text-muted-foreground">Не указана</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {teacher.title || (
                          <span className="text-sm text-muted-foreground">Не указана</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant="secondary"
                          className={
                            teacher.user.active
                              ? "rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "rounded-full"
                          }
                        >
                          {teacher.user.active ? "Активен" : "Отключен"}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">{teacher._count.lessonPairs}</TableCell>
                      <TableCell className="pr-4 align-top">
                        {teacher._count.cleaningEvaluations}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-sm text-muted-foreground">
              Преподаватели еще не добавлены. Создайте первую запись через кнопку вверху страницы.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
