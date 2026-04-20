"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import {
  createGroup,
  createStudent,
  updateSettings,
} from "@/modules/admin/service";
import {
  createGroupSchema,
  createStudentSchema,
} from "@/modules/admin/schemas";
import {
  confirmScheduleImport,
  previewScheduleImport,
} from "@/modules/schedule/service";

export async function previewScheduleImportAction(formData: FormData) {
  const session = await requireRole(["ADMIN"]);

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Файл не выбран.");
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const rawBuffer = new Uint8Array(await file.arrayBuffer());
  const rawPayload = isPdf ? "" : new TextDecoder().decode(rawBuffer);
  const preview = await previewScheduleImport({
    actorUserId: session.user.id,
    fileName: file.name,
    mimeType: file.type,
    rawPayload,
    rawBuffer,
    adapterKey: "mock",
  });

  revalidatePath("/admin/imports");

  return {
    success: true,
    importId: preview.id,
    message: "Предпросмотр импорта подготовлен.",
  };
}

export async function confirmScheduleImportAction(importId: string) {
  const session = await requireRole(["ADMIN"]);

  const importedCount = await confirmScheduleImport(importId, session.user.id);

  revalidatePath("/admin/imports");
  revalidatePath("/manager");
  revalidatePath("/manager/schedule");

  return {
    success: true,
    message: `Импорт подтвержден. Обработано ${importedCount} записей.`,
  };
}

export async function updateSettingsAction(values: Record<string, boolean | number>) {
  const session = await requireRole(["ADMIN"]);

  await updateSettings(session.user.id, values);

  revalidatePath("/admin/settings");

  return { success: true, message: "Настройки сохранены." };
}

export async function createGroupAction(values: unknown) {
  const session = await requireRole(["ADMIN"]);
  const parsed = createGroupSchema.parse(values);

  const group = await createGroup(session.user.id, parsed);

  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/students");

  return {
    success: true,
    message: `Группа ${group.name} создана.`,
    groupId: group.id,
  };
}

export async function createStudentAction(values: unknown) {
  const session = await requireRole(["ADMIN"]);
  const parsed = createStudentSchema.parse(values);

  const student = await createStudent(session.user.id, parsed);

  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/students");

  return {
    success: true,
    message: `Студент ${student.user.fullName} добавлен.`,
    studentId: student.id,
  };
}
