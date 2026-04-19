import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDayLabel, formatTimeRange } from "@/lib/date";

type WeeklyScheduleBoardProps = {
  days: Array<{
    id: string;
    date: Date;
    lessonPairs: Array<{
      id: string;
      pairNumber: number;
      subject: string;
      startTime: string;
      endTime: string;
      teacherName: string | null;
    }>;
  }>;
  emptyMessage: string;
};

export function WeeklyScheduleBoard({
  days,
  emptyMessage,
}: WeeklyScheduleBoardProps) {
  if (!days.length) {
    return (
      <Card className="border-border/60 shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {days.map((day) => (
        <Card
          key={day.id}
          className="overflow-hidden border-border/70 bg-[linear-gradient(180deg,rgba(0,136,130,0.06),transparent_42%)] shadow-none"
        >
          <CardHeader className="border-b border-border/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{formatDayLabel(day.date)}</CardTitle>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {day.lessonPairs.length} {day.lessonPairs.length === 1 ? "пара" : "пары"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 p-4">
            {day.lessonPairs.length ? (
              day.lessonPairs.map((pair) => (
                <div
                  key={pair.id}
                  className="grid gap-3 rounded-2xl border border-border/60 bg-background/86 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                    {pair.pairNumber}
                  </div>
                  <div>
                    <div className="font-medium">{pair.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimeRange(pair.startTime, pair.endTime)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground sm:text-right">
                    {pair.teacherName ?? "Преподаватель не указан"}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                На этот день пары не найдены.
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
