import { formatDistanceToNow, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookCheck,
  CalendarClock,
  FileSpreadsheet,
  Settings2,
  ShieldPlus,
  Sparkles,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";

import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ABSENCE_STATUS_LABELS,
  CLEANING_COMPLEXITY_LABELS,
  DUTY_STATUS_LABELS,
  QUALITY_LABELS,
  SCHEDULE_IMPORT_STATUS_LABELS,
} from "@/lib/constants";
import { formatShortDate } from "@/lib/date";
import { getAuditLogEntries } from "@/modules/admin/service";

type AuditEntry = Awaited<ReturnType<typeof getAuditLogEntries>>[number];

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function readNestedString(
  value: unknown,
  path: string[],
) {
  let current: unknown = value;

  for (const segment of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" && current.trim() ? current : null;
}

function formatAuditValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  if (value in DUTY_STATUS_LABELS) {
    return DUTY_STATUS_LABELS[value as keyof typeof DUTY_STATUS_LABELS];
  }

  if (value in QUALITY_LABELS) {
    return QUALITY_LABELS[value as keyof typeof QUALITY_LABELS];
  }

  if (value in ABSENCE_STATUS_LABELS) {
    return ABSENCE_STATUS_LABELS[value as keyof typeof ABSENCE_STATUS_LABELS];
  }

  if (value in CLEANING_COMPLEXITY_LABELS) {
    return CLEANING_COMPLEXITY_LABELS[value as keyof typeof CLEANING_COMPLEXITY_LABELS];
  }

  if (value in SCHEDULE_IMPORT_STATUS_LABELS) {
    return SCHEDULE_IMPORT_STATUS_LABELS[value as keyof typeof SCHEDULE_IMPORT_STATUS_LABELS];
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatShortDate(value);
  }

  return value;
}

function getChangedSettings(beforeValue: unknown, afterValue: unknown) {
  const before = asArray(beforeValue).map((item) => asRecord(item)).filter(Boolean) as Array<
    Record<string, unknown>
  >;
  const after = asArray(afterValue).map((item) => asRecord(item)).filter(Boolean) as Array<
    Record<string, unknown>
  >;
  const beforeMap = new Map(before.map((item) => [String(item.key), item.valueJson]));

  return after
    .filter((item) => beforeMap.get(String(item.key)) !== item.valueJson)
    .map((item) => String(item.key));
}

function getAttendanceChanges(beforeValue: unknown, afterValue: unknown) {
  const before = asArray(beforeValue).map((item) => asRecord(item)).filter(Boolean) as Array<
    Record<string, unknown>
  >;
  const after = asArray(afterValue).map((item) => asRecord(item)).filter(Boolean) as Array<
    Record<string, unknown>
  >;
  const beforeMap = new Map(before.map((item) => [String(item.id), item.status]));

  return after.filter((item) => beforeMap.get(String(item.id)) !== item.status).length;
}

function getCategoryLabel(action: string) {
  if (action.startsWith("admin.")) {
    return "Администрирование";
  }

  if (action.startsWith("schedule.")) {
    return "Расписание";
  }

  if (action.startsWith("attendance.") || action.startsWith("absence.")) {
    return "Посещаемость";
  }

  if (action.startsWith("duty.")) {
    return "Дежурства";
  }

  return "Система";
}

function getCategoryIcon(action: string): LucideIcon {
  if (action === "admin.group.created") {
    return UsersRound;
  }

  if (action === "admin.student.created") {
    return UserRoundPlus;
  }

  if (action === "admin.settings.updated") {
    return Settings2;
  }

  if (action.startsWith("schedule.")) {
    return FileSpreadsheet;
  }

  if (action.startsWith("attendance.") || action.startsWith("absence.")) {
    return BookCheck;
  }

  if (action.startsWith("duty.")) {
    return Sparkles;
  }

  return Activity;
}

function getCategoryTone(action: string): "teal" | "blue" | "rose" | "amber" {
  if (action.startsWith("schedule.")) {
    return "blue";
  }

  if (action === "admin.settings.updated") {
    return "amber";
  }

  if (action.startsWith("duty.")) {
    return "teal";
  }

  if (action.startsWith("attendance.") || action.startsWith("absence.")) {
    return "rose";
  }

  return "blue";
}

function presentAuditEntry(entry: AuditEntry) {
  const after = asRecord(entry.afterJson);
  const metadata = asRecord(entry.metadata);
  const category = getCategoryLabel(entry.action);
  const icon = getCategoryIcon(entry.action);
  const tone = getCategoryTone(entry.action);

  const fallback = {
    title: category,
    summary: "Событие зафиксировано в журнале аудита.",
    details: [] as string[],
  };

  switch (entry.action) {
    case "admin.group.created":
      return {
        category,
        icon,
        tone,
        title: after?.name ? `Создана группа ${String(after.name)}` : "Создана новая группа",
        summary:
          after?.course && after?.year
            ? `Курс ${String(after.course)}, набор ${String(after.year)}`
            : "Группа добавлена в систему.",
        details: after?.department ? [`Отделение: ${String(after.department)}`] : [],
      };

    case "admin.student.created":
      return {
        category,
        icon,
        tone,
        title: after?.fullName
          ? `Добавлен студент ${String(after.fullName)}`
          : "Создан профиль студента",
        summary: after?.groupName
          ? `Группа: ${String(after.groupName)}`
          : "Учетная запись студента добавлена в систему.",
        details: [after?.email, after?.login].filter(Boolean).map((value) => String(value)),
      };

    case "admin.settings.updated": {
      const changed = getChangedSettings(entry.beforeJson, entry.afterJson);

      return {
        category,
        icon,
        tone,
        title: "Обновлены системные правила",
        summary: changed.length
          ? `Изменено параметров: ${changed.length}`
          : "Настройки были сохранены без видимых изменений.",
        details: changed.slice(0, 5).map((item) => `Параметр: ${item}`),
      };
    }

    case "schedule.import.confirmed":
      return {
        category,
        icon,
        tone,
        title: "Подтверждён импорт расписания",
        summary: after?.itemCount
          ? `В расписание перенесено ${String(after.itemCount)} записей`
          : "Импорт расписания подтверждён.",
        details: after?.status ? [`Статус: ${formatAuditValue(after.status)}`] : [],
      };

    case "attendance.batch.saved": {
      const changed = getAttendanceChanges(entry.beforeJson, entry.afterJson);
      const total = asArray(entry.afterJson).length;

      return {
        category,
        icon,
        tone,
        title: "Сохранена посещаемость по паре",
        summary: `После сохранения в журнале ${total} отметок.`,
        details: [`Изменено статусов: ${changed}`],
      };
    }

    case "absence.request.created":
      return {
        category,
        icon: CalendarClock,
        tone,
        title: "Создана заявка на отсутствие",
        summary:
          after?.date && after?.status
            ? `${formatShortDate(String(after.date))} • ${formatAuditValue(after.status)}`
            : "Новая заявка зарегистрирована в системе.",
        details: after?.type ? [`Тип: ${String(after.type) === "DAY" ? "На день" : "На пару"}`] : [],
      };

    case "duty.assignments.created":
      return {
        category,
        icon,
        tone,
        title: "Созданы назначения на дежурства",
        summary: `Назначений в пакете: ${asArray(entry.afterJson).length}`,
        details: [
          metadata?.mode ? `Режим: ${String(metadata.mode)}` : null,
          metadata?.complexityCode
            ? `Сложность: ${formatAuditValue(metadata.complexityCode)}`
            : null,
        ]
          .filter(Boolean)
          .map((value) => String(value)),
      };

    case "duty.booking.created":
      return {
        category,
        icon,
        tone,
        title: "Создана бронь дежурства",
        summary: after?.date
          ? `Дата брони: ${formatShortDate(String(after.date))}`
          : "Бронь дежурства зарегистрирована.",
        details: [],
      };

    case "duty.assignment.deleted":
      return {
        category,
        icon,
        tone,
        title: "Назначение дежурства удалено",
        summary:
          readNestedString(entry.beforeJson, ["assignedStudent", "user", "fullName"]) ??
          "Назначение было удалено из журнала дежурств.",
        details: readNestedString(entry.beforeJson, ["relatedLessonPair", "subject"])
          ? [`Пара: ${readNestedString(entry.beforeJson, ["relatedLessonPair", "subject"])}`]
          : [],
      };

    case "duty.assignment.evaluated":
      return {
        category,
        icon,
        tone,
        title: "Дежурство оценено преподавателем",
        summary: [after?.quality, after?.status]
          .map((value) => formatAuditValue(value))
          .filter(Boolean)
          .join(" • "),
        details: after?.replacementStudentId ? ["Подтверждена замена исполнителя"] : [],
      };

    default:
      return {
        ...fallback,
        category,
        icon,
        tone,
      };
  }
}

export default async function AdminAuditPage() {
  const entries = await getAuditLogEntries();
  const presentedEntries = entries.map((entry) => ({
    entry,
    view: presentAuditEntry(entry),
  }));
  const todayCount = entries.filter((entry) => isToday(entry.createdAt)).length;
  const scheduleCount = entries.filter((entry) => entry.action.startsWith("schedule.")).length;
  const dutyCount = entries.filter((entry) => entry.action.startsWith("duty.")).length;
  const attendanceCount = entries.filter(
    (entry) =>
      entry.action.startsWith("attendance.") || entry.action.startsWith("absence."),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title="Журнал действий"
        description="Понятная история изменений: кто и когда менял расписание, дежурства, настройки и посещаемость."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Всего событий"
          value={entries.length}
          hint="Последние 100 записей"
          icon={ShieldPlus}
          tone="blue"
        />
        <MetricCard
          label="Сегодня"
          value={todayCount}
          hint={todayCount > 0 ? "Есть свежие изменения" : "Новых событий нет"}
          trend={todayCount > 0 ? "up" : "neutral"}
          icon={Activity}
          tone="teal"
        />
        <MetricCard
          label="Расписание"
          value={scheduleCount}
          hint="Импорты и подтверждения"
          icon={FileSpreadsheet}
          tone="blue"
        />
        <MetricCard
          label="Дежурства и посещаемость"
          value={dutyCount + attendanceCount}
          hint={`Дежурства: ${dutyCount}, посещаемость: ${attendanceCount}`}
          icon={BookCheck}
          tone="amber"
        />
      </div>

      <div className="grid gap-3">
        {presentedEntries.map(({ entry, view }) => {
          const Icon = view.icon;

          return (
            <Card
              key={entry.id}
              className="border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_55%)] shadow-none"
            >
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
                <div className="flex items-center gap-3 lg:w-[17rem] lg:flex-col lg:items-start">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background/80">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">{view.title}</div>
                    <div className="text-sm text-muted-foreground">{view.summary}</div>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {view.category}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        view.tone === "rose"
                          ? "rounded-full bg-rose-500/10 px-3 py-1 text-rose-700 dark:text-rose-300"
                          : view.tone === "amber"
                            ? "rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-300"
                            : view.tone === "teal"
                              ? "rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300"
                              : "rounded-full bg-sky-500/10 px-3 py-1 text-sky-700 dark:text-sky-300"
                      }
                    >
                      {entry.actorUser?.fullName ?? "Система"}
                    </Badge>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {formatDistanceToNow(entry.createdAt, { addSuffix: true, locale: ru })}
                    </span>
                  </div>

                  {view.details.length ? (
                    <div className="flex flex-wrap gap-2">
                      {view.details.map((detail) => (
                        <div
                          key={detail}
                          className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
                        >
                          {detail}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {formatShortDate(entry.createdAt)} • {entry.entityType} • {entry.entityId}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
