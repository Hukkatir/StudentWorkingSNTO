"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatCompactDayLabel,
  formatCompactWeekRange,
  formatDateParam,
} from "@/lib/date";
import { cn } from "@/lib/utils";

type DateNavigatorProps = {
  basePath: string;
  currentDate: Date;
  mode?: "day" | "week";
  className?: string;
};

export function DateNavigator({
  basePath,
  currentDate,
  mode = "day",
  className,
}: DateNavigatorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const currentParam = formatDateParam(currentDate);
  const [draftDate, setDraftDate] = useState(currentParam);

  useEffect(() => {
    setDraftDate(currentParam);
  }, [currentParam]);

  const step = mode === "week" ? 7 : 1;
  const currentLabel =
    mode === "week"
      ? `Неделя ${formatCompactWeekRange(currentDate)}`
      : formatCompactDayLabel(currentDate);

  const prevHref = `${basePath}?date=${formatDateParam(addDays(currentDate, -step))}`;
  const nextHref = `${basePath}?date=${formatDateParam(addDays(currentDate, step))}`;
  const resetLabel = mode === "week" ? "Эта неделя" : "Сегодня";
  const popoverTitle = mode === "week" ? "Выбрать неделю" : "Выбрать дату";
  const popoverDescription =
    mode === "week"
      ? "Укажите любой день внутри нужной недели, и страница откроет весь недельный блок."
      : "Выберите точный день, чтобы быстро перейти к нужной дате.";

  const goToPath = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draftDate) {
      return;
    }

    goToPath(`${basePath}?date=${draftDate}`);
  };

  return (
    <div className={cn("flex min-w-fit items-center gap-2", className)}>
      <Link
        href={prevHref}
        className={cn(
          buttonVariants({ variant: "outline", size: "xs" }),
          "shrink-0 rounded-2xl border-border/70 bg-background/90 px-2.5 shadow-sm",
        )}
      >
        <ChevronLeft className="size-4" />
      </Link>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="xs"
              className="h-9 shrink-0 rounded-2xl border-border/70 bg-[linear-gradient(180deg,rgba(0,136,130,0.08),rgba(255,255,255,0.92))] px-3 text-left font-medium shadow-sm dark:bg-[linear-gradient(180deg,rgba(0,136,130,0.12),rgba(16,24,24,0.94))]"
            />
          }
        >
          <CalendarDays className="size-4 text-primary" />
          <span className="max-w-[10.5rem] truncate whitespace-nowrap">{currentLabel}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] rounded-3xl p-4">
          <PopoverHeader className="gap-1">
            <PopoverTitle>{popoverTitle}</PopoverTitle>
            <PopoverDescription>{popoverDescription}</PopoverDescription>
          </PopoverHeader>

          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input
              type="date"
              value={draftDate}
              onChange={(event) => setDraftDate(event.target.value)}
              className="h-11 rounded-2xl"
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 rounded-2xl">
                Перейти
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => goToPath(basePath)}
              >
                {resetLabel}
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>

      <Link
        href={basePath}
        className={cn(
          buttonVariants({ variant: "outline", size: "xs" }),
          "shrink-0 rounded-2xl border-border/70 bg-background/90 px-3 shadow-sm whitespace-nowrap",
        )}
      >
        {resetLabel}
      </Link>
      <Link
        href={nextHref}
        className={cn(
          buttonVariants({ variant: "outline", size: "xs" }),
          "shrink-0 rounded-2xl border-border/70 bg-background/90 px-2.5 shadow-sm",
        )}
      >
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}
