import { AlertTriangle, BarChart3, ShieldAlert, Sparkles } from "lucide-react";

import { GroupStatisticsCharts } from "@/components/statistics/group-statistics-charts";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { getGroupStatistics } from "@/modules/statistics/service";

export default async function ManagerStatisticsPage() {
  const session = await requireRole(MANAGER_ROLES);

  if (!session.user.primaryGroupId) {
    return null;
  }

  const statistics = await getGroupStatistics(session.user.primaryGroupId);
  const rows = [...statistics.rows].sort(
    (left, right) =>
      Number(right.inRedZone) - Number(left.inRedZone) ||
      left.currentBalance - right.currentBalance ||
      left.fullName.localeCompare(right.fullName, "ru"),
  );
  const refusalTotal = rows.reduce((sum, row) => sum + row.refusalCount, 0);
  const escapeTotal = rows.reduce((sum, row) => sum + row.escapeCount, 0);
  const averageBalance = rows.length
    ? Number(
        (
          rows.reduce((sum, row) => sum + row.currentBalance, 0) / rows.length
        ).toFixed(1),
      )
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="analytics" title="Статистика группы" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Студентов в группе"
          value={statistics.summary.studentCount}
          hint={`${statistics.summary.redZoneCount} требуют внимания`}
          trend={statistics.summary.redZoneCount > 0 ? "down" : "neutral"}
          icon={BarChart3}
          tone="blue"
        />
        <MetricCard
          label="В красной зоне"
          value={statistics.summary.redZoneCount}
          hint={statistics.summary.redZoneCount ? "Есть зона риска" : "Все стабильно"}
          trend={statistics.summary.redZoneCount ? "down" : "up"}
          icon={ShieldAlert}
          tone={statistics.summary.redZoneCount ? "rose" : "teal"}
        />
        <MetricCard
          label="Закрытых дежурств"
          value={statistics.summary.totalCompletedDuties}
          hint={`Средний баланс: ${averageBalance}`}
          trend={averageBalance >= 0 ? "up" : "down"}
          icon={Sparkles}
          tone="teal"
        />
        <MetricCard
          label="Сумма штрафов"
          value={statistics.summary.totalPenalties}
          hint={`Бонусов выдано: ${statistics.summary.totalBonuses}`}
          trend={
            statistics.summary.totalPenalties > statistics.summary.totalBonuses
              ? "down"
              : "neutral"
          }
          icon={AlertTriangle}
          tone="amber"
        />
      </div>

      <GroupStatisticsCharts
        dutyChart={statistics.dutyChart}
        pointsChart={statistics.pointsChart}
      />

      <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(0,136,130,0.05),transparent_38%)] shadow-none">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <CardTitle>Сводная таблица по студентам</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Отказы: {refusalTotal}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Побеги: {escapeTotal}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Бонусы: {statistics.summary.totalBonuses}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Студент</TableHead>
                <TableHead>Дежурств</TableHead>
                <TableHead>Назначений</TableHead>
                <TableHead>Отказов</TableHead>
                <TableHead>Побегов</TableHead>
                <TableHead>Бонусы</TableHead>
                <TableHead>Штрафы</TableHead>
                <TableHead>Баланс</TableHead>
                <TableHead className="pr-4 text-right">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell className="pl-4">
                    <div className="flex flex-col gap-1 whitespace-normal">
                      <span className="font-medium">{row.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.inRedZone
                          ? "Нужен дополнительный контроль"
                          : "Рабочий статус стабильный"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{row.completedDuties}</TableCell>
                  <TableCell>{row.assignedCount}</TableCell>
                  <TableCell>{row.refusalCount}</TableCell>
                  <TableCell>{row.escapeCount}</TableCell>
                  <TableCell>{row.totalBonuses}</TableCell>
                  <TableCell>{row.totalPenalties}</TableCell>
                  <TableCell>
                    <span
                      className={
                        row.currentBalance < 0
                          ? "font-semibold text-rose-600 dark:text-rose-300"
                          : "font-semibold text-emerald-700 dark:text-emerald-300"
                      }
                    >
                      {row.currentBalance}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Badge
                      variant="secondary"
                      className={
                        row.inRedZone
                          ? "rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : "rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      }
                    >
                      {row.inRedZone ? "Красная зона" : "Стабильно"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell className="pl-4 font-semibold">Итого</TableCell>
                <TableCell>{statistics.summary.totalCompletedDuties}</TableCell>
                <TableCell>{rows.reduce((sum, row) => sum + row.assignedCount, 0)}</TableCell>
                <TableCell>{refusalTotal}</TableCell>
                <TableCell>{escapeTotal}</TableCell>
                <TableCell>{statistics.summary.totalBonuses}</TableCell>
                <TableCell>{statistics.summary.totalPenalties}</TableCell>
                <TableCell>{rows.reduce((sum, row) => sum + row.currentBalance, 0)}</TableCell>
                <TableCell className="pr-4 text-right">
                  {statistics.summary.redZoneCount} из {statistics.summary.studentCount}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
