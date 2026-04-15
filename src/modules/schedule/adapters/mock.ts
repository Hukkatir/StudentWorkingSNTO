import { z } from "zod";

import type {
  ParsedScheduleItem,
  ParsedSchedulePreview,
  ScheduleImportAdapter,
  ScheduleImportInput,
} from "@/modules/schedule/adapters/base";

const scheduleRowSchema = z.object({
  groupName: z.string().min(1),
  date: z.string().min(1),
  pairNumber: z.coerce.number().int().positive(),
  subject: z.string().min(1),
  teacherName: z.string().min(1),
  room: z.string().optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

function parseCsv(rawPayload: string): ParsedScheduleItem[] {
  const [headerLine, ...lines] = rawPayload
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const delimiter = headerLine.includes(";") ? ";" : ",";
  const headers = headerLine.split(delimiter).map((item) => item.trim());

  return lines.map((line) => {
    const values = line.split(delimiter).map((item) => item.trim());
    const row = headers.reduce<Record<string, string>>((accumulator, header, index) => {
      accumulator[header] = values[index] ?? "";
      return accumulator;
    }, {});

    return scheduleRowSchema.parse(row);
  });
}

function parseJson(rawPayload: string): ParsedScheduleItem[] {
  const payload = JSON.parse(rawPayload);
  return z.array(scheduleRowSchema).parse(payload);
}

export const mockScheduleImportAdapter: ScheduleImportAdapter = {
  key: "mock",
  label: "Mock adapter",
  async parse(input: ScheduleImportInput): Promise<ParsedSchedulePreview> {
    try {
      return {
        items: parseJson(input.rawPayload),
        warnings: [],
      };
    } catch {
      return {
        items: parseCsv(input.rawPayload),
        warnings: [
          "JSON не распознан, поэтому импорт выполнен через упрощенный CSV-парсер.",
        ],
      };
    }
  },
};
