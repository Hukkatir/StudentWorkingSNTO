import { db } from "@/lib/db";
import {
  APP_SETTING_KEYS,
  DEFAULT_APP_SETTINGS,
  readBooleanSetting,
  readNumberSetting,
} from "@/lib/config/app-settings";

export async function getSettingsMap() {
  const records = await db.appSetting.findMany();
  const rawMap = new Map(records.map((record) => [record.key, record.valueJson]));

  return {
    dutyLookbackDays: readNumberSetting(
      rawMap.get(APP_SETTING_KEYS.dutyLookbackDays),
      DEFAULT_APP_SETTINGS[APP_SETTING_KEYS.dutyLookbackDays] as number,
    ),
    redZoneIncidentThreshold: readNumberSetting(
      rawMap.get(APP_SETTING_KEYS.redZoneIncidentThreshold),
      DEFAULT_APP_SETTINGS[APP_SETTING_KEYS.redZoneIncidentThreshold] as number,
    ),
    maxConsecutiveBookingDays: readNumberSetting(
      rawMap.get(APP_SETTING_KEYS.maxConsecutiveBookingDays),
      DEFAULT_APP_SETTINGS[APP_SETTING_KEYS.maxConsecutiveBookingDays] as number,
    ),
    absenceAutoApproval: readBooleanSetting(
      rawMap.get(APP_SETTING_KEYS.absenceAutoApproval),
      DEFAULT_APP_SETTINGS[APP_SETTING_KEYS.absenceAutoApproval] as boolean,
    ),
    qualityPenaltyValue: readNumberSetting(
      rawMap.get(APP_SETTING_KEYS.qualityPenaltyValue),
      DEFAULT_APP_SETTINGS[APP_SETTING_KEYS.qualityPenaltyValue] as number,
    ),
    qualityBonusValue: readNumberSetting(
      rawMap.get(APP_SETTING_KEYS.qualityBonusValue),
      DEFAULT_APP_SETTINGS[APP_SETTING_KEYS.qualityBonusValue] as number,
    ),
  };
}
