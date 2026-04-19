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

type GroupStatisticsChartsProps = {
  dutyChart: Array<{ name: string; duties: number; balance: number }>;
  pointsChart: Array<{ name: string; bonuses: number; penalties: number }>;
};

const dutyConfig = {
  duties: { label: "Дежурства", color: "var(--color-chart-1)" },
  balance: { label: "Баланс", color: "var(--color-chart-4)" },
};

const pointsConfig = {
  bonuses: { label: "Бонусы", color: "var(--color-chart-2)" },
  penalties: { label: "Штрафы", color: "var(--color-chart-3)" },
};

export function GroupStatisticsCharts({
  dutyChart,
  pointsChart,
}: GroupStatisticsChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(0,136,130,0.08),transparent_44%)] shadow-none">
        <CardHeader className="border-b border-border/60">
          <CardTitle>Нагрузка по студентам</CardTitle>
          <CardDescription>
            Сколько дежурств уже закрыто и как меняется текущий баланс группы.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {dutyChart.length ? (
            <ChartContainer config={dutyConfig} className="h-[300px] w-full">
              <ComposedChart data={dutyChart}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={10} />
                <YAxis tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="duties"
                  fill="var(--color-duties)"
                  radius={[10, 10, 4, 4]}
                  maxBarSize={34}
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
              Данных для графика пока нет.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(20,56,122,0.06),transparent_42%)] shadow-none">
        <CardHeader className="border-b border-border/60">
          <CardTitle>Бонусы и штрафы</CardTitle>
          <CardDescription>
            Видно, кто чаще получает поощрения, а где уже нужна дополнительная работа.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {pointsChart.length ? (
            <ChartContainer config={pointsConfig} className="h-[300px] w-full">
              <BarChart data={pointsChart}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={10} />
                <YAxis tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="bonuses"
                  fill="var(--color-bonuses)"
                  radius={[10, 10, 4, 4]}
                  maxBarSize={30}
                />
                <Bar
                  dataKey="penalties"
                  fill="var(--color-penalties)"
                  radius={[10, 10, 4, 4]}
                  maxBarSize={30}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Данных для графика пока нет.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
