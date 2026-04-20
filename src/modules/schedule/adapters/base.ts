export type ParsedScheduleItem = {
  groupName: string;
  date: string;
  pairNumber: number;
  subject: string;
  teacherName: string;
  room?: string;
  startTime: string;
  endTime: string;
};

export type ParsedSchedulePreview = {
  items: ParsedScheduleItem[];
  warnings: string[];
  normalizedSourceText?: string;
};

export type ScheduleImportInput = {
  fileName: string;
  mimeType?: string | null;
  rawPayload: string;
  rawBuffer?: Uint8Array;
};

export interface ScheduleImportAdapter {
  key: string;
  label: string;
  parse(input: ScheduleImportInput): Promise<ParsedSchedulePreview>;
}
