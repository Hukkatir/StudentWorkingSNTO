import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

const EYEBROW_LABELS: Record<string, string> = {
  admin: "администратор",
  attendance: "посещаемость",
  duties: "дежурства",
  analytics: "аналитика",
  student: "студент",
  teacher: "преподаватель",
  "group manager": "староста",
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  const eyebrowLabel = eyebrow ? EYEBROW_LABELS[eyebrow.toLowerCase()] ?? eyebrow : null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          {eyebrowLabel ? (
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              {eyebrowLabel}
            </span>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 pb-1 xl:justify-end">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
