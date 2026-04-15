import { addDays, startOfDay } from "date-fns";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getSettingsMap } from "@/lib/server/settings";
import {
  absenceRequestSchema,
  saveAttendanceSchema,
  type CreateAbsenceRequestInput,
  type SaveAttendanceInput,
} from "@/modules/attendance/schemas";
import { refreshStudentMetrics } from "@/modules/students/service";

export async function getAttendanceDayOverview(groupId: string, date = new Date()) {
  const dayStart = startOfDay(date);
  const nextDay = addDays(dayStart, 1);

  return db.lessonDay.findFirst({
    where: {
      groupId,
      date: {
        gte: dayStart,
        lt: nextDay,
      },
    },
    include: {
      lessonPairs: {
        include: {
          attendanceRecords: true,
        },
        orderBy: { pairNumber: "asc" },
      },
    },
  });
}

export async function getAttendancePairData(lessonPairId: string) {
  const lessonPair = await db.lessonPair.findUnique({
    where: { id: lessonPairId },
    include: {
      lessonDay: true,
      scheduleItem: true,
      group: true,
      attendanceRecords: true,
    },
  });

  if (!lessonPair || !lessonPair.scheduleItem) {
    throw new AppError("Пара для учета посещаемости не найдена.");
  }

  const [students, reasons, absenceRequests] = await Promise.all([
    db.studentProfile.findMany({
      where: { groupId: lessonPair.groupId },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          fullName: "asc",
        },
      },
    }),
    db.absenceReason.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    db.absenceRequest.findMany({
      where: {
        groupId: lessonPair.groupId,
        studentId: {
          in: (
            await db.studentProfile.findMany({
              where: { groupId: lessonPair.groupId },
              select: { id: true },
            })
          ).map((student) => student.id),
        },
        OR: [
          { type: "DAY", date: lessonPair.lessonDay.date },
          { type: "LESSON", lessonPairId: lessonPair.id },
        ],
        status: {
          in: ["APPROVED", "AUTO_REGISTERED"],
        },
      },
      include: {
        reason: true,
      },
    }),
  ]);

  const recordMap = new Map(
    lessonPair.attendanceRecords.map((record) => [record.studentId, record]),
  );
  const plannedAbsenceMap = new Map(
    absenceRequests.map((request) => [request.studentId, request]),
  );

  return {
    lessonPair,
    reasons,
    students: students.map((student) => ({
      ...student,
      attendanceRecord: recordMap.get(student.id) ?? null,
      plannedAbsence: plannedAbsenceMap.get(student.id) ?? null,
    })),
  };
}

export async function saveAttendanceBatch(
  actorUserId: string,
  input: SaveAttendanceInput,
) {
  const parsed = saveAttendanceSchema.parse(input);

  const lessonPair = await db.lessonPair.findUnique({
    where: { id: parsed.lessonPairId },
    include: { scheduleItem: true },
  });

  if (!lessonPair?.scheduleItemId) {
    throw new AppError("Не удалось найти связанную пару в расписании.");
  }

  const beforeState = await db.attendanceRecord.findMany({
    where: { lessonPairId: lessonPair.id },
  });

  await db.$transaction(
    parsed.rows.map((row) =>
      db.attendanceRecord.upsert({
        where: {
          studentId_scheduleItemId: {
            studentId: row.studentId,
            scheduleItemId: lessonPair.scheduleItemId!,
          },
        },
        update: {
          status: row.status,
          reasonId:
            row.status === "ABSENT" || row.status === "EXCUSED"
              ? row.reasonId ?? null
              : null,
          comment: row.comment ?? null,
          updatedById: actorUserId,
        },
        create: {
          studentId: row.studentId,
          groupId: lessonPair.groupId,
          scheduleItemId: lessonPair.scheduleItemId!,
          lessonPairId: lessonPair.id,
          status: row.status,
          reasonId:
            row.status === "ABSENT" || row.status === "EXCUSED"
              ? row.reasonId ?? null
              : null,
          comment: row.comment ?? null,
          createdById: actorUserId,
          updatedById: actorUserId,
        },
      }),
    ),
  );

  const afterState = await db.attendanceRecord.findMany({
    where: { lessonPairId: lessonPair.id },
  });

  await createAuditLog({
    actorUserId,
    action: "attendance.batch.saved",
    entityType: "LessonPair",
    entityId: lessonPair.id,
    before: beforeState,
    after: afterState,
  });

  await refreshStudentMetrics(parsed.rows.map((row) => row.studentId));
}

export async function createAbsenceRequest(
  actorUserId: string,
  input: CreateAbsenceRequestInput,
) {
  const parsed = absenceRequestSchema.parse(input);
  const settings = await getSettingsMap();
  const lessonPair = parsed.lessonPairId
    ? await db.lessonPair.findUnique({
        where: { id: parsed.lessonPairId },
        include: { scheduleItem: true },
      })
    : null;

  const request = await db.absenceRequest.create({
    data: {
      studentId: parsed.studentId,
      groupId: parsed.groupId,
      type: parsed.type,
      date: startOfDay(new Date(parsed.date)),
      lessonPairId: parsed.lessonPairId ?? null,
      scheduleItemId: lessonPair?.scheduleItemId ?? null,
      reasonId: parsed.reasonId,
      comment: parsed.comment ?? null,
      status: settings.absenceAutoApproval ? "AUTO_REGISTERED" : "PENDING",
      autoApplied: settings.absenceAutoApproval,
      approvedById: settings.absenceAutoApproval ? actorUserId : null,
      reviewedAt: settings.absenceAutoApproval ? new Date() : null,
    },
    include: {
      reason: true,
    },
  });

  await createAuditLog({
    actorUserId,
    action: "absence.request.created",
    entityType: "AbsenceRequest",
    entityId: request.id,
    after: request,
  });

  return request;
}

export async function getStudentAbsenceRequests(studentId: string) {
  return db.absenceRequest.findMany({
    where: { studentId },
    include: {
      reason: true,
      lessonPair: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
