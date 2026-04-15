"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { previewScheduleImport, confirmScheduleImport } from "@/modules/schedule/service";
import { updateSettings } from "@/modules/admin/service";

export async function previewScheduleImportAction(formData: FormData) {
  const session = await requireRole(["ADMIN"]);

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Файл не выбран.");
  }

  const rawPayload = await file.text();
  const preview = await previewScheduleImport({
    actorUserId: session.user.id,
    fileName: file.name,
    mimeType: file.type,
    rawPayload,
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
