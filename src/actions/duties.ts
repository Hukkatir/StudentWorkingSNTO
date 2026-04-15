"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { MANAGER_ROLES, TEACHING_ROLES } from "@/lib/auth/permissions";
import {
  calculateDutyCandidates,
  createAutomaticDutyAssignments,
  createDutyAssignments,
  createDutyBooking,
  deleteDutyAssignment,
  evaluateDutyAssignment,
} from "@/modules/duties/service";

export async function createManualDutyAssignmentsAction(
  input: Parameters<typeof createDutyAssignments>[1],
) {
  const session = await requireRole(MANAGER_ROLES);

  await createDutyAssignments(session.user.id, input);

  revalidatePath("/manager");
  revalidatePath("/manager/duties");

  return { success: true, message: "Дежурные назначены вручную." };
}

export async function createAutomaticDutyAssignmentsAction(
  input: Parameters<typeof createAutomaticDutyAssignments>[1],
) {
  const session = await requireRole(MANAGER_ROLES);

  await createAutomaticDutyAssignments(session.user.id, input);

  revalidatePath("/manager");
  revalidatePath("/manager/duties");

  return { success: true, message: "Автоподбор дежурных выполнен." };
}

export async function previewDutyCandidatesAction(input: {
  groupId: string;
  date: string;
  count: number;
  complexityCode: "LIGHT" | "MODERATE" | "FULL";
  lessonPairId?: string | null;
}) {
  await requireRole(MANAGER_ROLES);

  const result = await calculateDutyCandidates(
    input.groupId,
    input.date,
    input.count,
    input.complexityCode,
    input.lessonPairId,
  );

  return {
    count: result.count,
    lessonPair: result.lessonPair,
    allCandidates: result.allCandidates,
    selectedCandidates: result.selectedCandidates,
  };
}

export async function createDutyBookingAction(
  input: Parameters<typeof createDutyBooking>[1],
) {
  const session = await requireRole(["STUDENT", "ADMIN"]);

  await createDutyBooking(session.user.id, input);

  revalidatePath("/student");
  revalidatePath("/student/bookings");
  revalidatePath("/manager/duties");

  return { success: true, message: "Бронь на дежурство создана." };
}

export async function evaluateDutyAssignmentAction(
  input: Parameters<typeof evaluateDutyAssignment>[1],
) {
  const session = await requireRole(TEACHING_ROLES);

  await evaluateDutyAssignment(session.user.id, input);

  revalidatePath("/teacher");
  revalidatePath("/teacher/evaluations");
  revalidatePath("/manager/log");
  revalidatePath("/manager/statistics");
  revalidatePath("/student/statistics");

  return { success: true, message: "Оценка уборки сохранена." };
}

export async function deleteDutyAssignmentAction(
  input: Parameters<typeof deleteDutyAssignment>[1],
) {
  const session = await requireRole(MANAGER_ROLES);

  await deleteDutyAssignment(session.user.id, input);

  revalidatePath("/manager");
  revalidatePath("/manager/duties");
  revalidatePath("/manager/log");
  revalidatePath("/teacher");
  revalidatePath("/student");

  return { success: true, message: "Назначение дежурства удалено." };
}
