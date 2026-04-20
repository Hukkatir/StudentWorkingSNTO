import { inflateSync } from "node:zlib";
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

type StructuredField = keyof ParsedScheduleItem | "timeRange";

const STRUCTURED_HEADER_ALIASES: Record<StructuredField, string[]> = {
  groupName: ["group", "groupname", "группа", "група"],
  date: ["date", "day", "дата"],
  pairNumber: ["pair", "pairnumber", "lesson", "пара", "номерпары", "номер"],
  subject: ["subject", "discipline", "предмет", "дисциплина"],
  teacherName: ["teacher", "teachername", "преподаватель", "препод"],
  room: ["room", "cabinet", "classroom", "аудитория", "кабинет"],
  startTime: ["start", "starttime", "начало"],
  endTime: ["end", "endtime", "конец", "окончание"],
  timeRange: ["time", "timerange", "время", "интервал"],
};

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

function normalizeHeaderToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]/g, "");
}

function mapStructuredHeader(value: string): StructuredField | null {
  const normalized = normalizeHeaderToken(value);

  for (const [field, aliases] of Object.entries(STRUCTURED_HEADER_ALIASES) as Array<
    [StructuredField, string[]]
  >) {
    if (aliases.includes(normalized)) {
      return field;
    }
  }

  return null;
}

function normalizeDateCell(value: string) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);

  if (!match) {
    return trimmed;
  }

  const [, day, month, year] = match;
  const normalizedYear = year.length === 2 ? `20${year}` : year;

  return `${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeTimeCell(value: string) {
  const match = value.trim().match(/([01]?\d|2[0-3]):([0-5]\d)/);

  if (!match) {
    return value.trim();
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function parseTimeRange(value: string) {
  const matches = [...value.matchAll(/([01]?\d|2[0-3]):([0-5]\d)/g)].map(
    (match) => `${match[1].padStart(2, "0")}:${match[2]}`,
  );

  if (matches.length < 2) {
    return null;
  }

  return {
    startTime: matches[0],
    endTime: matches[1],
  };
}

function splitStructuredLine(line: string) {
  const normalized = line.replace(/\u00a0/g, " ").trim();

  if (!normalized) {
    return [];
  }

  if (normalized.includes(";")) {
    return normalized.split(";").map((item) => item.trim());
  }

  if (normalized.includes("\t")) {
    return normalized.split(/\t+/).map((item) => item.trim());
  }

  if (normalized.includes("|")) {
    return normalized.split("|").map((item) => item.trim());
  }

  return normalized.split(/\s{2,}/).map((item) => item.trim());
}

function createStructuredRowCandidate(values: Partial<Record<StructuredField, string>>) {
  const timeRange = values.timeRange ? parseTimeRange(values.timeRange) : null;
  const rawStartTime = values.startTime ?? timeRange?.startTime ?? "";
  const rawEndTime = values.endTime ?? timeRange?.endTime ?? "";

  return scheduleRowSchema.parse({
    groupName: (values.groupName ?? "").trim(),
    date: normalizeDateCell(values.date ?? ""),
    pairNumber: Number(values.pairNumber ?? 0),
    subject: (values.subject ?? "").trim(),
    teacherName: (values.teacherName ?? "").trim(),
    room: values.room?.trim() || undefined,
    startTime: normalizeTimeCell(rawStartTime),
    endTime: normalizeTimeCell(rawEndTime),
  });
}

function parseStructuredText(rawPayload: string): ParsedScheduleItem[] {
  const lines = rawPayload
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("Файл не содержит строк для импорта.");
  }

  const firstLineColumns = splitStructuredLine(lines[0]);
  const headerMap = firstLineColumns.map((value) => mapStructuredHeader(value));
  const hasStructuredHeader =
    headerMap.filter(Boolean).length >= 5 &&
    headerMap.includes("groupName") &&
    headerMap.includes("date") &&
    headerMap.includes("pairNumber") &&
    headerMap.includes("subject");

  if (hasStructuredHeader) {
    const rows = lines
      .slice(1)
      .map((line) => {
        const columns = splitStructuredLine(line);

        if (columns.length < 6) {
          return null;
        }

        const values = columns.reduce<Partial<Record<StructuredField, string>>>(
          (accumulator, column, index) => {
            const field = headerMap[index];

            if (field) {
              accumulator[field] = column;
            }

            return accumulator;
          },
          {},
        );

        try {
          return createStructuredRowCandidate(values);
        } catch {
          return null;
        }
      })
      .filter((item): item is ParsedScheduleItem => Boolean(item));

    if (rows.length) {
      return rows;
    }
  }

  const fallbackRows = lines
    .map((line) => {
      const columns = splitStructuredLine(line);

      if (columns.length < 6) {
        return null;
      }

      const variants: Array<Partial<Record<StructuredField, string>>> = [];

      if (columns.length >= 8) {
        variants.push({
          groupName: columns[0],
          date: columns[1],
          pairNumber: columns[2],
          subject: columns[3],
          teacherName: columns[4],
          room: columns[5],
          startTime: columns[6],
          endTime: columns[7],
        });
        variants.push({
          date: columns[0],
          groupName: columns[1],
          pairNumber: columns[2],
          subject: columns[3],
          teacherName: columns[4],
          room: columns[5],
          startTime: columns[6],
          endTime: columns[7],
        });
      }

      variants.push(
        columns.length >= 7
          ? {
              groupName: columns[0],
              date: columns[1],
              pairNumber: columns[2],
              subject: columns[3],
              teacherName: columns[4],
              room: columns[5],
              timeRange: columns[6],
            }
          : {
              groupName: columns[0],
              date: columns[1],
              pairNumber: columns[2],
              subject: columns[3],
              teacherName: columns[4],
              timeRange: columns[5],
            },
      );

      for (const variant of variants) {
        try {
          return createStructuredRowCandidate(variant);
        } catch {
          continue;
        }
      }

      return null;
    })
    .filter((item): item is ParsedScheduleItem => Boolean(item));

  if (!fallbackRows.length) {
    throw new Error("Не удалось определить структуру строк расписания.");
  }

  return fallbackRows;
}

function decodePdfLiteral(value: string) {
  let result = "";

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char !== "\\") {
      result += char;
      continue;
    }

    const next = value[index + 1];

    if (!next) {
      break;
    }

    if (/[0-7]/.test(next)) {
      const octal = value.slice(index + 1, index + 4).match(/^[0-7]{1,3}/)?.[0] ?? next;
      result += String.fromCharCode(parseInt(octal, 8));
      index += octal.length;
      continue;
    }

    const escapedMap: Record<string, string> = {
      n: "\n",
      r: "\r",
      t: "\t",
      b: "\b",
      f: "\f",
      "(": "(",
      ")": ")",
      "\\": "\\",
    };

    result += escapedMap[next] ?? next;
    index += 1;
  }

  return result;
}

function decodePdfHexString(value: string) {
  const clean = value.replace(/\s+/g, "");

  if (!clean) {
    return "";
  }

  try {
    return Buffer.from(clean, "hex").toString("utf8");
  } catch {
    return "";
  }
}

function extractPdfTextOperators(content: string) {
  const fragments: string[] = [];

  for (const match of content.matchAll(/\((?:\\.|[^\\()])*\)\s*Tj/g)) {
    const literal = match[0].match(/^\(([\s\S]*)\)\s*Tj$/)?.[1];

    if (literal) {
      fragments.push(decodePdfLiteral(literal));
    }
  }

  for (const match of content.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g)) {
    fragments.push(decodePdfHexString(match[1]));
  }

  for (const match of content.matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
    const chunk = match[1];

    for (const item of chunk.matchAll(/\((?:\\.|[^\\()])*\)|<([0-9A-Fa-f\s]+)>/g)) {
      if (item[0].startsWith("(")) {
        fragments.push(decodePdfLiteral(item[0].slice(1, -1)));
      } else if (item[1]) {
        fragments.push(decodePdfHexString(item[1]));
      }
    }

    fragments.push("\n");
  }

  return fragments.join("\n");
}

function inflatePdfStream(slice: Buffer) {
  const variants = [slice, slice.subarray(0, slice.length - 1), slice.subarray(0, slice.length - 2)];

  for (const candidate of variants) {
    if (candidate.length <= 0) {
      continue;
    }

    try {
      return inflateSync(candidate);
    } catch {
      continue;
    }
  }

  return null;
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPdfText(input: ScheduleImportInput) {
  const buffer = input.rawBuffer
    ? Buffer.from(input.rawBuffer)
    : Buffer.from(input.rawPayload, "utf8");
  const source = buffer.toString("latin1");
  const fragments = [extractPdfTextOperators(source)];
  let searchIndex = 0;

  while (searchIndex < source.length) {
    const streamIndex = source.indexOf("stream", searchIndex);

    if (streamIndex === -1) {
      break;
    }

    const endIndex = source.indexOf("endstream", streamIndex);

    if (endIndex === -1) {
      break;
    }

    let contentStart = streamIndex + "stream".length;

    if (source.startsWith("\r\n", contentStart)) {
      contentStart += 2;
    } else if (source.startsWith("\n", contentStart)) {
      contentStart += 1;
    }

    let contentEnd = endIndex;

    while (contentEnd > contentStart && /\r|\n/.test(source[contentEnd - 1])) {
      contentEnd -= 1;
    }

    const dictionaryStart = source.lastIndexOf("<<", streamIndex);
    const dictionaryEnd = dictionaryStart === -1 ? -1 : source.indexOf(">>", dictionaryStart);
    const dictionary =
      dictionaryStart !== -1 && dictionaryEnd !== -1 && dictionaryEnd < streamIndex
        ? source.slice(dictionaryStart, dictionaryEnd + 2)
        : source.slice(Math.max(0, streamIndex - 180), streamIndex);

    const streamBytes = buffer.subarray(contentStart, contentEnd);
    let content = "";

    if (dictionary.includes("/FlateDecode")) {
      const inflated = inflatePdfStream(streamBytes);
      content = inflated ? inflated.toString("latin1") : "";
    } else {
      content = streamBytes.toString("latin1");
    }

    if (content) {
      fragments.push(extractPdfTextOperators(content));
    }

    searchIndex = endIndex + "endstream".length;
  }

  return normalizeExtractedText(fragments.join("\n"));
}

export const mockScheduleImportAdapter: ScheduleImportAdapter = {
  key: "mock",
  label: "Файловый импорт",
  async parse(input: ScheduleImportInput): Promise<ParsedSchedulePreview> {
    const warnings: string[] = [];
    const isPdf =
      input.mimeType === "application/pdf" || input.fileName.toLowerCase().endsWith(".pdf");
    const normalizedSourceText = isPdf ? extractPdfText(input) : input.rawPayload;

    if (isPdf) {
      warnings.push(
        "PDF разбирается как текстовая таблица. Если файл отсканирован картинкой, сначала нужен OCR.",
      );
    }

    try {
      return {
        items: parseJson(normalizedSourceText),
        warnings,
        normalizedSourceText,
      };
    } catch {}

    try {
      return {
        items: parseCsv(normalizedSourceText),
        warnings: [
          ...warnings,
          isPdf
            ? "PDF прочитан через текстовый слой. Перед подтверждением проверьте предметы, даты и время."
            : "JSON не распознан, поэтому файл обработан как CSV.",
        ],
        normalizedSourceText,
      };
    } catch {}

    return {
      items: parseStructuredText(normalizedSourceText),
      warnings: [
        ...warnings,
        isPdf
          ? "PDF разобран по строкам таблицы. Перед подтверждением стоит проверить превью."
          : "Файл распознан по колонкам текста без JSON/CSV-шаблона.",
      ],
      normalizedSourceText,
    };
  },
};
