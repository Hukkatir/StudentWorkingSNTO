import { format, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";

export function formatDayLabel(value: Date | string) {
  return format(new Date(value), "d MMMM, EEEE", { locale: ru });
}

export function formatWeekday(value: Date | string) {
  return format(new Date(value), "EEEE", { locale: ru });
}

export function formatShortDate(value: Date | string) {
  return format(new Date(value), "dd.MM.yyyy");
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
