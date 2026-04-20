import type {
  AbsenceRequestStatus,
  AttendanceStatus,
  CleaningComplexityCode,
  CleaningQuality,
  DutyAssignmentStatus,
  DutyBookingStatus,
  PointTransactionType,
  RoleCode,
  ScheduleImportStatus,
} from "@prisma/client";

export const ROLE_LABELS: Record<RoleCode, string> = {
  ADMIN: "Администратор",
  CURATOR: "Куратор",
  GROUP_MANAGER: "Староста",
  TEACHER: "Преподаватель",
  STUDENT: "Студент",
};

export const ROLE_HOME: Record<RoleCode, string> = {
  ADMIN: "/admin",
  CURATOR: "/manager",
  GROUP_MANAGER: "/manager",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

export const ATTENDANCE_STATUS_OPTIONS: Array<{
  value: AttendanceStatus;
  label: string;
  shortLabel: string;
  tone: string;
}> = [
  { value: "PRESENT", label: "Присутствует", shortLabel: "Был", tone: "emerald" },
  { value: "ABSENT", label: "Отсутствует", shortLabel: "Нет", tone: "rose" },
  { value: "LATE", label: "Опоздал", shortLabel: "Опозд", tone: "amber" },
  {
    value: "EXCUSED",
    label: "Уважительная причина",
    shortLabel: "Уваж.",
    tone: "sky",
  },
];

export const ABSENCE_STATUS_LABELS: Record<AbsenceRequestStatus, string> = {
  PENDING: "На рассмотрении",
  APPROVED: "Подтверждено",
  REJECTED: "Отклонено",
  AUTO_REGISTERED: "Учтено автоматически",
};

export const DUTY_STATUS_LABELS: Record<DutyAssignmentStatus, string> = {
  ASSIGNED: "Назначено",
  COMPLETED: "Завершено",
  REFUSED: "Отказ",
  ESCAPED: "Побег",
  REPLACED: "Заменено",
  CANCELLED: "Отменено",
};

export const BOOKING_STATUS_LABELS: Record<DutyBookingStatus, string> = {
  ACTIVE: "Активна",
  USED: "Использована",
  CANCELLED: "Отменена",
  EXPIRED: "Истекла",
};

export const CLEANING_COMPLEXITY_LABELS: Record<CleaningComplexityCode, string> = {
  LIGHT: "Легкая",
  MODERATE: "Умеренная",
  FULL: "Полная",
};

export const QUALITY_LABELS: Record<CleaningQuality, string> = {
  EXCELLENT: "Отлично",
  GOOD: "Хорошо",
  SATISFACTORY: "Удовлетворительно",
  UNSATISFACTORY: "Неудовлетворительно",
  NOT_DONE: "Не выполнено",
};

export const SCHEDULE_IMPORT_STATUS_LABELS: Record<ScheduleImportStatus, string> = {
  PREVIEW: "Предпросмотр",
  CONFIRMED: "Подтвержден",
  FAILED: "Ошибка",
};

export const SCHEDULE_ADAPTER_LABELS: Record<string, string> = {
  mock: "Файловый импорт",
};

export const POINT_TRANSACTION_LABELS: Record<PointTransactionType, string> = {
  DUTY_BASE: "Базовые баллы за дежурство",
  DUTY_BONUS: "Бонус за дежурство",
  PENALTY_REFUSAL: "Штраф за отказ",
  PENALTY_ESCAPE: "Штраф за побег",
  QUALITY_BONUS: "Бонус за качество уборки",
  QUALITY_PENALTY: "Штраф за качество уборки",
  MANUAL_ADJUSTMENT: "Ручная корректировка",
};
