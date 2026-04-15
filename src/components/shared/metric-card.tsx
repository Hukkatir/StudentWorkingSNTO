import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  trend?: "up" | "down" | "neutral";
};

export function MetricCard({ label, value, hint, trend = "neutral" }: MetricCardProps) {
  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              trend === "up" && "text-emerald-700",
              trend === "down" && "text-rose-700",
              trend === "neutral" && "text-muted-foreground",
            )}
          >
            {trend === "up" ? <ArrowUpRight /> : null}
            {trend === "down" ? <ArrowDownRight /> : null}
            <span>{hint}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
