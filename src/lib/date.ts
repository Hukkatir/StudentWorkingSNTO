import { endOfWeek, format, isValid, parseISO, startOfDay, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";

export function formatDayLabel(value: Date | string) {
  return format(new Date(value), "d MMMM, EEEE", { locale: ru });
}

export function formatCompactDayLabel(value: Date | string) {
  return format(new Date(value), "d MMM, EEE", { locale: ru });
}

export function formatWeekday(value: Date | string) {
  return format(new Date(value), "EEEE", { locale: ru });
}

export function formatShortDate(value: Date | string) {
  return format(new Date(value), "dd.MM.yyyy");
}

export function formatDateParam(value: Date | string) {
  return format(new Date(value), "yyyy-MM-dd");
}

export function parseDateParam(value?: string | null) {
  if (!value) {
    return startOfDay(new Date());
  }

  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : startOfDay(new Date());
}

export function formatWeekRange(value: Date | string) {
  const date = new Date(value);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  if (format(weekStart, "MMMM", { locale: ru }) === format(weekEnd, "MMMM", { locale: ru })) {
    return `${format(weekStart, "d", { locale: ru })} - ${format(weekEnd, "d MMMM", {
      locale: ru,
    })}`;
  }

  return `${format(weekStart, "d MMMM", { locale: ru })} - ${format(weekEnd, "d MMMM", {
    locale: ru,
  })}`;
}

export function formatCompactWeekRange(value: Date | string) {
  const date = new Date(value);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  if (format(weekStart, "MMM", { locale: ru }) === format(weekEnd, "MMM", { locale: ru })) {
    return `${format(weekStart, "d", { locale: ru })}-${format(weekEnd, "d MMM", {
      locale: ru,
    })}`;
  }

  return `${format(weekStart, "d MMM", { locale: ru })}-${format(weekEnd, "d MMM", {
    locale: ru,
  })}`;
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime} - ${endTime}`;
}

export function getWeekStart(date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function toStartOfDay(value: Date | string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}
