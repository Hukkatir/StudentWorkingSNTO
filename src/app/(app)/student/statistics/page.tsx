import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POINT_TRANSACTION_LABELS } from "@/lib/constants";
import { requireRole } from "@/lib/auth/session";
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
        title="Моя статистика"
        description="Личная история дежурств, штрафов, бонусов и изменений баланса."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Назначений" value={statistics.totals.assigned} />
        <MetricCard label="Выполнено" value={statistics.totals.completed} />
        <MetricCard label="Инциденты" value={statistics.totals.incidents} />
        <MetricCard label="Бонусы" value={statistics.totals.bonuses} />
        <MetricCard label="Баланс" value={statistics.totals.balance} />
      </div>
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>История операций</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {statistics.student.pointTransactions.map((transaction) => (
            <div key={transaction.id} className="rounded-2xl border border-border/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {POINT_TRANSACTION_LABELS[transaction.type]}
                  </div>
                  <div className="text-sm text-muted-foreground">{transaction.comment}</div>
                </div>
                <div className="font-semibold">{transaction.value}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
