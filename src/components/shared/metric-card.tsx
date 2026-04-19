import { ArrowDownRight, ArrowUpRight, BarChart3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "teal" | "blue" | "rose" | "amber";
};

const toneStyles = {
  teal: {
    card:
      "bg-[linear-gradient(180deg,rgba(0,136,130,0.08),transparent_72%)] dark:bg-[linear-gradient(180deg,rgba(0,136,130,0.16),transparent_72%)]",
    orb: "bg-primary/10 dark:bg-primary/16",
    icon: "border-primary/15 bg-background/80 text-primary",
  },
  blue: {
    card:
      "bg-[linear-gradient(180deg,rgba(20,56,122,0.08),transparent_72%)] dark:bg-[linear-gradient(180deg,rgba(122,167,255,0.14),transparent_72%)]",
    orb: "bg-sky-500/10 dark:bg-sky-400/16",
    icon: "border-sky-500/15 bg-background/80 text-sky-700 dark:text-sky-300",
  },
  rose: {
    card:
      "bg-[linear-gradient(180deg,rgba(213,83,83,0.08),transparent_72%)] dark:bg-[linear-gradient(180deg,rgba(240,123,123,0.14),transparent_72%)]",
    orb: "bg-rose-500/10 dark:bg-rose-400/16",
    icon: "border-rose-500/15 bg-background/80 text-rose-700 dark:text-rose-300",
  },
  amber: {
    card:
      "bg-[linear-gradient(180deg,rgba(217,119,6,0.08),transparent_72%)] dark:bg-[linear-gradient(180deg,rgba(245,158,11,0.14),transparent_72%)]",
    orb: "bg-amber-500/10 dark:bg-amber-400/16",
    icon: "border-amber-500/15 bg-background/80 text-amber-700 dark:text-amber-300",
  },
} as const;

export function MetricCard({
  label,
  value,
  hint,
  trend = "neutral",
  icon: Icon = BarChart3,
  tone = "teal",
}: MetricCardProps) {
  const palette = toneStyles[tone];

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/70 bg-card shadow-[0_24px_55px_-40px_rgba(15,23,42,0.34)]",
        palette.card,
      )}
    >
      <div className={cn("absolute -right-8 -top-8 size-28 rounded-full blur-3xl", palette.orb)} />
      <CardContent className="relative flex h-full flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2 pr-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {label}
            </div>
            <div className="text-4xl font-semibold tracking-tight">{value}</div>
          </div>
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
              palette.icon,
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>

        {hint ? (
          <div
            className={cn(
              "mt-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium",
              trend === "up" && "text-emerald-700 dark:text-emerald-300",
              trend === "down" && "text-rose-700 dark:text-rose-300",
              trend === "neutral" && "text-muted-foreground",
            )}
          >
            {trend === "up" ? <ArrowUpRight className="size-4" /> : null}
            {trend === "down" ? <ArrowDownRight className="size-4" /> : null}
            <span>{hint}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
