export const APP_SETTING_KEYS = {
  dutyLookbackDays: "duty.lookbackDays",
  redZoneIncidentThreshold: "redZone.incidentThreshold",
  maxConsecutiveBookingDays: "duty.maxConsecutiveBookingDays",
  absenceAutoApproval: "absence.autoApproval",
  qualityPenaltyValue: "points.qualityPenaltyValue",
  qualityBonusValue: "points.qualityBonusValue",
} as const;

export type AppSettingKey =
  (typeof APP_SETTING_KEYS)[keyof typeof APP_SETTING_KEYS];

export const DEFAULT_APP_SETTINGS: Record<AppSettingKey, number | boolean> = {
  [APP_SETTING_KEYS.dutyLookbackDays]: 4,
  [APP_SETTING_KEYS.redZoneIncidentThreshold]: 2,
  [APP_SETTING_KEYS.maxConsecutiveBookingDays]: 2,
  [APP_SETTING_KEYS.absenceAutoApproval]: true,
  [APP_SETTING_KEYS.qualityPenaltyValue]: -1,
  [APP_SETTING_KEYS.qualityBonusValue]: 1,
};

export const APP_SETTING_DEFINITIONS = [
  {
    key: APP_SETTING_KEYS.dutyLookbackDays,
    label: "Окно недавних дежурств",
    description:
      "Количество учебных дней, в течение которых студент считается недавно дежурившим.",
  },
  {
    key: APP_SETTING_KEYS.redZoneIncidentThreshold,
    label: "Порог красной зоны по инцидентам",
    description:
      "Минимальное число отказов и побегов, после которого студент попадает в красную зону.",
  },
  {
    key: APP_SETTING_KEYS.maxConsecutiveBookingDays,
    label: "Лимит подряд идущих бронирований",
    description:
      "Максимум дней подряд, которые студент может забронировать заранее.",
  },
  {
    key: APP_SETTING_KEYS.absenceAutoApproval,
    label: "Автоодобрение заявок на отсутствие",
    description:
      "Если включено, заявки студента сразу учитываются системой без ручного подтверждения.",
  },
  {
    key: APP_SETTING_KEYS.qualityPenaltyValue,
    label: "Штраф за неудовлетворительную уборку",
    description:
      "Сколько баллов списывать при оценке уборки как неудовлетворительной.",
  },
  {
    key: APP_SETTING_KEYS.qualityBonusValue,
    label: "Бонус за отличную уборку",
    description:
      "Сколько дополнительных баллов давать за отличную уборку.",
  },
] as const;

export function readNumberSetting(
  rawValue: unknown,
  fallback: number,
): number {
  return typeof rawValue === "number" ? rawValue : fallback;
}

export function readBooleanSetting(
  rawValue: unknown,
  fallback: boolean,
): boolean {
  return typeof rawValue === "boolean" ? rawValue : fallback;
}
