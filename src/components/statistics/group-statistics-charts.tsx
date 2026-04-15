"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type GroupStatisticsChartsProps = {
  dutyChart: Array<{ name: string; duties: number; balance: number }>;
  pointsChart: Array<{ name: string; bonuses: number; penalties: number }>;
};

const dutyConfig = {
  duties: { label: "Дежурства", color: "var(--color-chart-1)" },
  balance: { label: "Баланс", color: "var(--color-chart-2)" },
};

const pointsConfig = {
  bonuses: { label: "Бонусы", color: "#0f766e" },
  penalties: { label: "Штрафы", color: "#b91c1c" },
};

export function GroupStatisticsCharts({
  dutyChart,
  pointsChart,
}: GroupStatisticsChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Количество дежурств</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={dutyConfig} className="h-[280px] w-full">
            <BarChart data={dutyChart}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="duties" fill="var(--color-duties)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Штрафы и бонусы</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pointsConfig} className="h-[280px] w-full">
            <BarChart data={pointsChart}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="bonuses" fill="var(--color-bonuses)" radius={8} />
              <Bar dataKey="penalties" fill="var(--color-penalties)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
