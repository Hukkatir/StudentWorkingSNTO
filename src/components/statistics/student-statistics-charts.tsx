"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StudentStatisticsChartsProps = {
  balanceTimeline: Array<{ label: string; balance: number; delta: number }>;
  statusChart: Array<{ name: string; value: number }>;
};

const balanceConfig = {
  delta: { label: "Изменение", color: "var(--color-chart-2)" },
  balance: { label: "Баланс", color: "var(--color-chart-4)" },
};

const statusConfig = {
  value: { label: "Количество", color: "var(--color-chart-1)" },
};

export function StudentStatisticsCharts({
  balanceTimeline,
  statusChart,
}: StudentStatisticsChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(0,136,130,0.08),transparent_44%)] shadow-none">
        <CardHeader className="border-b border-border/60">
          <CardTitle>Динамика баланса</CardTitle>
          <CardDescription>
            Видно, как менялся личный баланс после бонусов, штрафов и завершённых дежурств.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {balanceTimeline.length ? (
            <ChartContainer config={balanceConfig} className="h-[300px] w-full">
              <ComposedChart data={balanceTimeline}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={14} />
                <YAxis tickLine={false} axisLine={false} width={34} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="delta"
                  fill="var(--color-delta)"
                  radius={[10, 10, 4, 4]}
                  maxBarSize={28}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-balance)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--color-balance)", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Пока нет операций, из которых можно построить динамику.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(20,56,122,0.06),transparent_42%)] shadow-none">
        <CardHeader className="border-b border-border/60">
          <CardTitle>Структура назначений</CardTitle>
          <CardDescription>
            Сводка по всем дежурствам: сколько было назначено, выполнено и где появились инциденты.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {statusChart.length ? (
            <ChartContainer config={statusConfig} className="h-[300px] w-full">
              <BarChart data={statusChart}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={10} />
                <YAxis tickLine={false} axisLine={false} width={34} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={[10, 10, 4, 4]}
                  maxBarSize={36}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Для графика пока нет данных.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
