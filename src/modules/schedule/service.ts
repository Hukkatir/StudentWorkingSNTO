import { startOfDay } from "date-fns";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { ParsedScheduleItem } from "@/modules/schedule/adapters/base";
import { mockScheduleImportAdapter } from "@/modules/schedule/adapters/mock";

const previewPayloadSchema = z.object({
  warnings: z.array(z.string()),
  items: z.array(
    z.object({
      groupId: z.string().nullable(),
      groupName: z.string(),
      date: z.string(),
      pairNumber: z.number(),
      subject: z.string(),
      teacherName: z.string(),
      room: z.string().optional(),
      startTime: z.string(),
      endTime: z.string(),
    }),
  ),
});

const adapterRegistry = {
  mock: mockScheduleImportAdapter,
};

export function getScheduleAdapters() {
  return Object.values(adapterRegistry);
}

function normalizeDate(value: string) {
  return startOfDay(new Date(value));
}

async function resolvePreviewItems(items: ParsedScheduleItem[]) {
  const groups = await db.group.findMany({
    where: {
      name: {
        in: [...new Set(items.map((item) => item.groupName))],
      },
    },
  });

  const groupMap = new Map(groups.map((group) => [group.name, group.id]));

  return items.map((item) => ({
    ...item,
    groupId: groupMap.get(item.groupName) ?? null,
  }));
}

export async function previewScheduleImport(params: {
  actorUserId: string;
  fileName: string;
  mimeType?: string | null;
  rawPayload: string;
  rawBuffer?: Uint8Array;
  adapterKey?: keyof typeof adapterRegistry;
}) {
  const adapter = adapterRegistry[params.adapterKey ?? "mock"];
  let parsed: Awaited<ReturnType<typeof adapter.parse>>;

  try {
    parsed = await adapter.parse({
      fileName: params.fileName,
      mimeType: params.mimeType,
      rawPayload: params.rawPayload,
      rawBuffer: params.rawBuffer,
    });
  } catch (error) {
    const isPdf =
      params.mimeType === "application/pdf" || params.fileName.toLowerCase().endsWith(".pdf");

    parsed = {
      items: [],
      warnings: [
        isPdf
          ? "PDF загружен, но система не смогла распознать в нём структуру расписания. Если это скан или файл с нестандартным текстовым слоем, нужен OCR или экспорт в CSV/Excel."
          : "Не удалось распознать структуру файла. Попробуйте CSV, JSON или табличный PDF.",
        error instanceof Error ? error.message : "Импорт завершился с ошибкой разбора.",
      ],
      normalizedSourceText: params.rawPayload,
    };
  }

  const items = await resolvePreviewItems(parsed.items);

  const warnings = [
    ...parsed.warnings,
    ...items
      .filter((item) => !item.groupId)
      .map(
        (item) =>
          `Группа "${item.groupName}" не найдена в справочнике и будет пропущена при подтверждении.`,
      ),
  ];

  return db.scheduleImport.create({
    data: {
      adapterKey: adapter.key,
      sourceFilename: params.fileName,
      sourceMimeType: params.mimeType ?? null,
      rawPayload: parsed.normalizedSourceText ?? params.rawPayload,
      previewData: {
        items,
        warnings,
      },
      validationErrors: warnings.length ? warnings : undefined,
      importedById: params.actorUserId,
      itemCount: items.length,
      status: "PREVIEW",
      metadata: {
        adapterLabel: adapter.label,
        sourceFormat:
          params.mimeType === "application/pdf" || params.fileName.toLowerCase().endsWith(".pdf")
            ? "pdf"
            : "text",
      },
    },
  });
}

export async function getScheduleImportPreview(importId: string) {
  const scheduleImport = await db.scheduleImport.findUnique({
    where: { id: importId },
    include: {
      importedBy: true,
    },
  });

  if (!scheduleImport) {
    throw new AppError("Импорт не найден.");
  }

  const previewData = previewPayloadSchema.parse(scheduleImport.previewData);

  return {
    scheduleImport,
    previewData,
  };
}

export async function listScheduleImports() {
  return db.scheduleImport.findMany({
    include: {
      importedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function confirmScheduleImport(importId: string, actorUserId: string) {
  const { scheduleImport, previewData } = await getScheduleImportPreview(importId);

  const validItems = previewData.items.filter((item) => item.groupId);

  await db.$transaction(async (transaction) => {
    for (const item of validItems) {
      const existingScheduleItem = await transaction.scheduleItem.findFirst({
        where: {
          groupId: item.groupId!,
          date: normalizeDate(item.date),
          pairNumber: item.pairNumber,
        },
      });

      const scheduleItem = existingScheduleItem
        ? await transaction.scheduleItem.update({
            where: { id: existingScheduleItem.id },
            data: {
              subject: item.subject,
              teacherName: item.teacherName,
              room: item.room,
              startTime: item.startTime,
              endTime: item.endTime,
              sourceImportId: scheduleImport.id,
            },
          })
        : await transaction.scheduleItem.create({
            data: {
              groupId: item.groupId!,
              date: normalizeDate(item.date),
              pairNumber: item.pairNumber,
              subject: item.subject,
              teacherName: item.teacherName,
              room: item.room,
              startTime: item.startTime,
              endTime: item.endTime,
              sourceImportId: scheduleImport.id,
            },
          });

      const lessonDay = await transaction.lessonDay.upsert({
        where: {
          groupId_date: {
            groupId: item.groupId!,
            date: normalizeDate(item.date),
          },
        },
        create: {
          groupId: item.groupId!,
          date: normalizeDate(item.date),
        },
        update: {},
      });

      const existingPair = await transaction.lessonPair.findFirst({
        where: {
          lessonDayId: lessonDay.id,
          pairNumber: item.pairNumber,
        },
      });

      if (existingPair) {
        await transaction.lessonPair.update({
          where: { id: existingPair.id },
          data: {
            scheduleItemId: scheduleItem.id,
            subject: item.subject,
            teacherName: item.teacherName,
            room: item.room,
            startTime: item.startTime,
            endTime: item.endTime,
          },
        });
      } else {
        await transaction.lessonPair.create({
          data: {
            groupId: item.groupId!,
            lessonDayId: lessonDay.id,
            scheduleItemId: scheduleItem.id,
            pairNumber: item.pairNumber,
            subject: item.subject,
            teacherName: item.teacherName,
            room: item.room,
            startTime: item.startTime,
            endTime: item.endTime,
          },
        });
      }
    }

    await transaction.scheduleImport.update({
      where: { id: importId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });
  });

  await createAuditLog({
    actorUserId,
    action: "schedule.import.confirmed",
    entityType: "ScheduleImport",
    entityId: importId,
    before: { status: scheduleImport.status },
    after: { status: "CONFIRMED", itemCount: validItems.length },
  });

  return validItems.length;
}
