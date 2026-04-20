import {
  AlertTriangle,
  BadgeCheck,
  Sparkles,
  Trophy,
  WalletCards,
  Workflow,
} from "lucide-react";

import { StudentStatisticsCharts } from "@/components/statistics/student-statistics-charts";
import { MetricCard } from "@/components/shared/metric-card";
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
import { requireRole } from "@/lib/auth/session";
import { DUTY_STATUS_LABELS, POINT_TRANSACTION_LABELS, QUALITY_LABELS } from "@/lib/constants";
import { formatShortDate } from "@/lib/date";
import { getStudentStatistics } from "@/modules/statistics/service";

export default async function StudentStatisticsPage() {
  const session = await requireRole(["STUDENT", "ADMIN"]);

  if (!session.user.studentProfileId) {
    return null;
  }

  const statistics = await getStudentStatistics(session.user.studentProfileId);

  if (!statistics) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="student"
        title="Профиль и статистика"
        description="Личный баланс, история дежурств и последние изменения по вашему профилю."
      />

      <Card className="border-border/70 bg-[linear-gradient(145deg,rgba(0,136,130,0.12),rgba(20,56,122,0.06))] shadow-none">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.9fr)]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {statistics.student.groupName}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Баланс: {statistics.totals.balance}
              </Badge>
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight">
                {statistics.student.fullName}
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Здесь собраны ключевые показатели по дежурствам, личный баланс и последние
                операции, которые повлияли на статус внутри группы.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-border/60 bg-background/75 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3">
              <span className="text-sm text-muted-foreground">Место в группе</span>
              <span className="font-semibold">
                {statistics.comparison.groupRank ?? "—"} / {statistics.comparison.groupSize}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3">
              <span className="text-sm text-muted-foreground">Средний баланс группы</span>
              <span className="font-semibold">{statistics.comparison.averageBalance}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3">
              <span className="text-sm text-muted-foreground">Активных инцидентов</span>
              <span className="font-semibold">{statistics.totals.incidents}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
        <MetricCard
          label="Баланс"
          value={statistics.totals.balance}
          hint={
            statistics.totals.balance >= 0 ? "Баланс в рабочей зоне" : "Баланс требует внимания"
          }
          trend={statistics.totals.balance >= 0 ? "up" : "down"}
          icon={WalletCards}
          tone={statistics.totals.balance >= 0 ? "teal" : "rose"}
          size="spacious"
        />
        <MetricCard
          label="Назначений"
          value={statistics.totals.assigned}
          hint="Всего получено"
          icon={Workflow}
          tone="blue"
          size="spacious"
        />
        <MetricCard
          label="Завершено"
          value={statistics.totals.completed}
          hint={`Замены: ${statistics.totals.replacements}`}
          icon={BadgeCheck}
          tone="teal"
          size="spacious"
        />
        <MetricCard
          label="Инциденты"
          value={statistics.totals.incidents}
          hint={`Отказов: ${statistics.totals.refusalCount}, побегов: ${statistics.totals.escapeCount}`}
          trend={statistics.totals.incidents > 0 ? "down" : "neutral"}
          icon={AlertTriangle}
          tone="rose"
          size="spacious"
        />
        <MetricCard
          label="Бонусы"
          value={statistics.totals.bonuses}
          hint="Все положительные начисления"
          icon={Sparkles}
          tone="amber"
          size="spacious"
        />
        <MetricCard
          label="Рейтинг в группе"
          value={statistics.comparison.groupRank ?? "—"}
          hint={`Из ${statistics.comparison.groupSize} студентов`}
          icon={Trophy}
          tone="blue"
          size="spacious"
        />
      </div>

      <StudentStatisticsCharts
        balanceTimeline={statistics.balanceTimeline}
        statusChart={statistics.statusChart}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(0,136,130,0.05),transparent_36%)] shadow-none">
          <CardHeader className="border-b border-border/60">
            <CardTitle>История дежурств</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Дата</TableHead>
                  <TableHead>Контекст</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Оценка</TableHead>
                  <TableHead className="pr-4 text-right">Баллы</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statistics.dutyHistory.length ? (
                  statistics.dutyHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="pl-4">{formatShortDate(entry.date)}</TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{entry.complexityLabel}</span>
                          <span className="text-xs text-muted-foreground">{entry.lessonLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {DUTY_STATUS_LABELS[entry.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.quality ? (
                          <span className="text-sm">{QUALITY_LABELS[entry.quality]}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Ещё не оценено</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span
                          className={
                            entry.pointsDelta < 0
                              ? "font-semibold text-rose-600 dark:text-rose-300"
                              : "font-semibold text-emerald-700 dark:text-emerald-300"
                          }
                        >
                          {entry.pointsDelta > 0 ? `+${entry.pointsDelta}` : entry.pointsDelta}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                      История дежурств пока пустая.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(20,56,122,0.05),transparent_38%)] shadow-none">
          <CardHeader className="border-b border-border/60">
            <CardTitle>Последние операции по балансу</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4">
            {statistics.recentTransactions.length ? (
              statistics.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 p-4"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{POINT_TRANSACTION_LABELS[transaction.type]}</div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.comment || transaction.contextLabel || "Без дополнительного комментария"}
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {formatShortDate(transaction.createdAt)}
                    </div>
                  </div>
                  <div
                    className={
                      transaction.value < 0
                        ? "font-semibold text-rose-600 dark:text-rose-300"
                        : "font-semibold text-emerald-700 dark:text-emerald-300"
                    }
                  >
                    {transaction.value > 0 ? `+${transaction.value}` : transaction.value}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Пока нет операций, которые меняли баланс.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
