"use server";

import { revalidatePath } from "next/cache";

import { createAbsenceRequest, saveAttendanceBatch } from "@/modules/attendance/service";
import { requireRole } from "@/lib/auth/session";
import { MANAGER_ROLES, STUDENT_VISIBLE_ROLES } from "@/lib/auth/permissions";

export async function saveAttendanceAction(input: Parameters<typeof saveAttendanceBatch>[1]) {
  const session = await requireRole(MANAGER_ROLES);

  await saveAttendanceBatch(session.user.id, input);

  revalidatePath("/manager");
  revalidatePath("/manager/attendance");

  return { success: true, message: "Посещаемость сохранена." };
}

export async function createAbsenceRequestAction(
  input: Parameters<typeof createAbsenceRequest>[1],
) {
  const session = await requireRole(STUDENT_VISIBLE_ROLES);

  const request = await createAbsenceRequest(session.user.id, input);

  revalidatePath("/student");
  revalidatePath("/student/absences");
  revalidatePath("/manager");

  return {
    success: true,
    message: "Заявка на отсутствие сохранена.",
    requestId: request.id,
  };
}
