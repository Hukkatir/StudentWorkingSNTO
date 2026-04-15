import { addDays, differenceInCalendarDays, startOfDay, subDays } from "date-fns";
import type {
  CleaningComplexityCode,
  DutyAssignmentMode,
  Prisma,
} from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getSettingsMap } from "@/lib/server/settings";
import {
  calculateDutyCandidatesSchema,
  createDutyAssignmentsSchema,
  deleteDutyAssignmentSchema,
  dutyBookingSchema,
  evaluateDutySchema,
  type CalculateDutyCandidatesInput,
  type CreateDutyAssignmentsInput,
  type DeleteDutyAssignmentInput,
  type DutyBookingInput,
  type EvaluateDutyInput,
} from "@/modules/duties/schemas";
import { refreshStudentMetrics } from "@/modules/students/service";

function dayRange(value: Date | string) {
  const dayStart = startOfDay(new Date(value));
  return {
    dayStart,
    nextDay: addDays(dayStart, 1),
  };
}

async function getComplexityByCode(code: CleaningComplexityCode) {
  const complexity = await db.cleaningComplexity.findUnique({
    where: { code },
  });

  if (!complexity) {
    throw new AppError("Конфигурация сложности уборки не найдена.");
  }

  return complexity;
}

async function resolveLessonPairContext(params: {
  groupId: string;
  date: Date | string;
  lessonPairId?: string | null;
}) {
  if (!params.lessonPairId) {
    return null;
  }

  const lessonPair = await db.lessonPair.findUnique({
    where: { id: params.lessonPairId },
    include: {
      lessonDay: true,
      scheduleItem: true,
    },
  });

  if (!lessonPair || lessonPair.groupId !== params.groupId) {
    throw new AppError("Выбранная пара не найдена в этой группе.");
  }

  const { dayStart } = dayRange(params.date);

  if (lessonPair.lessonDay.date.getTime() !== dayStart.getTime()) {
    throw new AppError("Выбранная пара не относится к указанной дате.");
  }

  return lessonPair;
}

async function expireAbsentBookings(groupId: string, date: Date, presentStudentIds: string[]) {
  const { dayStart, nextDay } = dayRange(date);

  await db.dutyBooking.updateMany({
    where: {
      groupId,
      date: {
        gte: dayStart,
        lt: nextDay,
      },
      status: "ACTIVE",
      studentId: {
        notIn: presentStudentIds,
      },
    },
    data: {
      status: "EXPIRED",
    },
  });
}

export async function calculateDutyCandidates(
  groupId: string,
  date: Date | string,
  count: number,
  complexityCode: CleaningComplexityCode,
  lessonPairId?: string | null,
) {
  const parsed = calculateDutyCandidatesSchema.parse({
    groupId,
    date: new Date(date).toISOString(),
    count,
    complexityCode,
    lessonPairId: lessonPairId ?? null,
  } satisfies CalculateDutyCandidatesInput);

  const settings = await getSettingsMap();
  const { dayStart, nextDay } = dayRange(parsed.date);
  const lookbackStart = subDays(dayStart, settings.dutyLookbackDays);
  const lessonPair = await resolveLessonPairContext({
    groupId: parsed.groupId,
    date: parsed.date,
    lessonPairId: parsed.lessonPairId,
  });

  const [
    students,
    attendanceRecords,
    dayAbsences,
    lessonAbsences,
    bookings,
    recentAssignments,
    existingAssignments,
  ] = await Promise.all([
      db.studentProfile.findMany({
        where: { groupId: parsed.groupId },
        include: { user: true },
        orderBy: {
          user: {
            fullName: "asc",
          },
        },
      }),
      db.attendanceRecord.findMany({
        where: {
          groupId: parsed.groupId,
          ...(lessonPair
            ? { lessonPairId: lessonPair.id }
            : {
                scheduleItem: {
                  date: {
                    gte: dayStart,
                    lt: nextDay,
                  },
                },
              }),
          status: {
            in: ["PRESENT", "LATE"],
          },
        },
        select: {
          studentId: true,
        },
      }),
      db.absenceRequest.findMany({
        where: {
          groupId: parsed.groupId,
          type: "DAY",
          date: dayStart,
          status: {
            in: ["APPROVED", "AUTO_REGISTERED"],
          },
        },
        select: {
          studentId: true,
        },
      }),
      lessonPair
        ? db.absenceRequest.findMany({
            where: {
              groupId: parsed.groupId,
              type: "LESSON",
              lessonPairId: lessonPair.id,
              status: {
                in: ["APPROVED", "AUTO_REGISTERED"],
              },
            },
            select: {
              studentId: true,
            },
          })
        : Promise.resolve([]),
      db.dutyBooking.findMany({
        where: {
          groupId: parsed.groupId,
          date: {
            gte: dayStart,
            lt: nextDay,
          },
          status: "ACTIVE",
        },
      }),
      db.dutyAssignment.findMany({
        where: {
          groupId: parsed.groupId,
          date: {
            gte: lookbackStart,
            lt: nextDay,
          },
          status: {
            in: ["ASSIGNED", "COMPLETED", "REPLACED"],
          },
        },
        orderBy: { date: "desc" },
      }),
      db.dutyAssignment.findMany({
        where: {
          groupId: parsed.groupId,
          date: {
            gte: dayStart,
            lt: nextDay,
          },
          status: {
            notIn: ["CANCELLED"],
          },
        },
        select: {
          assignedStudentId: true,
        },
      }),
    ]);

  const excludedByAbsence = new Set([
    ...dayAbsences.map((absence) => absence.studentId),
    ...lessonAbsences.map((absence) => absence.studentId),
  ]);
  const presentStudentIds = new Set(attendanceRecords.map((record) => record.studentId));
  const existingAssignmentsSet = new Set(
    existingAssignments.map((assignment) => assignment.assignedStudentId),
  );

  const bookingMap = new Map(bookings.map((booking) => [booking.studentId, booking]));
  const assignmentsByStudent = new Map<string, typeof recentAssignments>();

  for (const assignment of recentAssignments) {
    const collection = assignmentsByStudent.get(assignment.assignedStudentId) ?? [];
    collection.push(assignment);
    assignmentsByStudent.set(assignment.assignedStudentId, collection);
  }

  const candidates = students
    .filter((student) => {
      if (excludedByAbsence.has(student.id) || existingAssignmentsSet.has(student.id)) {
        return false;
      }

      return presentStudentIds.has(student.id);
    })
    .map((student) => {
      const recentStudentAssignments = assignmentsByStudent.get(student.id) ?? [];
      const booking = bookingMap.get(student.id);
      const lastRecentDuty = recentStudentAssignments[0];
      const daysSinceLastDuty = lastRecentDuty
        ? differenceInCalendarDays(dayStart, lastRecentDuty.date)
        : null;
      const recentDutyCount = recentStudentAssignments.length;

      let score = student.currentDutyScore * 10 + student.totalDuties * 5 + recentDutyCount * 25;
      const reasons = [
        `Баланс баллов: ${student.currentDutyScore}`,
        `Всего дежурств: ${student.totalDuties}`,
      ];

      if (booking) {
        score -= 1000;
        reasons.unshift("Есть активная бронь на этот день");
      }

      if (daysSinceLastDuty !== null) {
        score += Math.max(0, 10 - daysSinceLastDuty) * 2;
        reasons.push(`Последнее дежурство ${daysSinceLastDuty} дн. назад`);
      } else {
        score -= 5;
        reasons.push("Нет завершенных дежурств в истории");
      }

      reasons.push("Студент отмечен как присутствующий.");

      if (lessonPair) {
        reasons.push(`Контекст подбора: пара ${lessonPair.pairNumber} ${lessonPair.subject}.`);
      }

      return {
        studentId: student.id,
        fullName: student.user.fullName,
        currentDutyScore: student.currentDutyScore,
        totalDuties: student.totalDuties,
        recentDutyCount,
        hasActiveBooking: Boolean(booking),
        score,
        reasons,
      };
    })
    .sort((left, right) => left.score - right.score);

  const complexity = await getComplexityByCode(parsed.complexityCode);

  return {
    complexity,
    count: parsed.count,
    lessonPair: lessonPair
      ? {
          id: lessonPair.id,
          pairNumber: lessonPair.pairNumber,
          subject: lessonPair.subject,
          startTime: lessonPair.startTime,
          endTime: lessonPair.endTime,
        }
      : null,
    allCandidates: candidates,
    selectedCandidates: candidates.slice(0, parsed.count),
  };
}

async function createPointTransaction(params: {
  tx: Prisma.TransactionClient;
  studentId: string;
  groupId: string;
  createdById: string;
  type:
    | "DUTY_BASE"
    | "DUTY_BONUS"
    | "PENALTY_REFUSAL"
    | "PENALTY_ESCAPE"
    | "QUALITY_BONUS"
    | "QUALITY_PENALTY"
    | "MANUAL_ADJUSTMENT";
  value: number;
  relatedDutyAssignmentId?: string | null;
  penaltyReasonCode?: "REFUSAL" | "ESCAPE" | "UNSATISFACTORY_CLEANING" | "NO_SHOW" | "MANUAL";
  bonusReasonCode?: "REPLACEMENT" | "QUALITY_EXCELLENT" | "EXTRA_CLEANING" | "MANUAL";
  comment?: string | null;
}) {
  const [penaltyReason, bonusReason] = await Promise.all([
    params.penaltyReasonCode
      ? params.tx.penaltyReason.findUnique({
          where: { code: params.penaltyReasonCode },
        })
      : Promise.resolve(null),
    params.bonusReasonCode
      ? params.tx.bonusReason.findUnique({
          where: { code: params.bonusReasonCode },
        })
      : Promise.resolve(null),
  ]);

  return params.tx.pointTransaction.create({
    data: {
      studentId: params.studentId,
      groupId: params.groupId,
      type: params.type,
      value: params.value,
      relatedDutyAssignmentId: params.relatedDutyAssignmentId ?? null,
      penaltyReasonId: penaltyReason?.id ?? null,
      bonusReasonId: bonusReason?.id ?? null,
      comment: params.comment ?? null,
      createdById: params.createdById,
    },
  });
}

export async function createDutyAssignments(
  actorUserId: string,
  input: CreateDutyAssignmentsInput,
) {
  const parsed = createDutyAssignmentsSchema.parse(input);
  const { dayStart, nextDay } = dayRange(parsed.date);
  const complexity = await getComplexityByCode(parsed.complexityCode);
  const lessonPair = await resolveLessonPairContext({
    groupId: parsed.groupId,
    date: parsed.date,
    lessonPairId: parsed.lessonPairId,
  });

  const bookings = await db.dutyBooking.findMany({
    where: {
      groupId: parsed.groupId,
      date: {
        gte: dayStart,
        lt: nextDay,
      },
      status: "ACTIVE",
      studentId: {
        in: parsed.studentIds,
      },
    },
  });

  const bookingMap = new Map(bookings.map((booking) => [booking.studentId, booking]));
  const existingAssignments = await db.dutyAssignment.findMany({
    where: {
      groupId: parsed.groupId,
      date: {
        gte: dayStart,
        lt: nextDay,
      },
      assignedStudentId: {
        in: parsed.studentIds,
      },
      status: {
        notIn: ["CANCELLED"],
      },
    },
  });

  if (existingAssignments.length > 0) {
    throw new AppError("Для одного из выбранных студентов дежурство уже создано.");
  }

  const attendanceCandidates = await calculateDutyCandidates(
    parsed.groupId,
    parsed.date,
    parsed.studentIds.length,
    parsed.complexityCode,
    parsed.lessonPairId,
  );

  const presentIds = new Set(
    attendanceCandidates.allCandidates.map((candidate) => candidate.studentId),
  );

  await expireAbsentBookings(parsed.groupId, dayStart, [...presentIds]);

  const lessonDay = await db.lessonDay.findFirst({
    where: {
      groupId: parsed.groupId,
      date: {
        gte: dayStart,
        lt: nextDay,
      },
    },
  });

  const createdAssignments = await db.$transaction(
    parsed.studentIds.map((studentId) => {
      const booking = bookingMap.get(studentId);
      const assignmentMode: DutyAssignmentMode =
        booking && parsed.mode === "AUTO" ? "BOOKED" : parsed.mode;

      return db.dutyAssignment.create({
        data: {
          groupId: parsed.groupId,
          date: dayStart,
          relatedLessonDayId: lessonPair?.lessonDayId ?? lessonDay?.id ?? null,
          relatedLessonPairId: lessonPair?.id ?? null,
          assignedStudentId: studentId,
          assignedById: actorUserId,
          bookingId: booking?.id ?? null,
          assignmentMode,
          cleaningComplexityId: complexity.id,
          basePoints: complexity.basePoints,
          notes: parsed.notes ?? null,
        },
      });
    }),
  );

  await db.dutyBooking.updateMany({
    where: {
      id: {
        in: createdAssignments
          .map((assignment) => assignment.bookingId)
          .filter((value): value is string => Boolean(value)),
      },
    },
    data: { status: "USED" },
  });

  await createAuditLog({
    actorUserId,
    action: "duty.assignments.created",
    entityType: "DutyAssignment",
    entityId: createdAssignments[0]?.id ?? "batch",
    after: createdAssignments,
    metadata: {
      mode: parsed.mode,
      complexityCode: parsed.complexityCode,
      lessonPairId: parsed.lessonPairId ?? null,
    },
  });

  return createdAssignments;
}

export async function createAutomaticDutyAssignments(
  actorUserId: string,
  input: Omit<CreateDutyAssignmentsInput, "studentIds" | "mode"> & { count: number },
) {
  const candidates = await calculateDutyCandidates(
    input.groupId,
    input.date,
    input.count,
    input.complexityCode,
    input.lessonPairId,
  );

  if (candidates.selectedCandidates.length === 0) {
    throw new AppError(
      "Нет присутствующих студентов для автоподбора. Сначала отметьте посещаемость.",
    );
  }

  if (candidates.selectedCandidates.length < input.count) {
    throw new AppError(
      "Недостаточно присутствующих студентов для выбранного количества дежурных.",
    );
  }

  return createDutyAssignments(actorUserId, {
    ...input,
    studentIds: candidates.selectedCandidates.map((candidate) => candidate.studentId),
    mode: "AUTO",
  });
}

function calculateBookingStreak(dates: Date[], candidateDate: Date) {
  const normalized = [...new Set([...dates, candidateDate].map((date) => startOfDay(date).toISOString()))]
    .map((value) => new Date(value))
    .sort((left, right) => left.getTime() - right.getTime());

  let best = 1;
  let current = 1;

  for (let index = 1; index < normalized.length; index += 1) {
    const previous = normalized[index - 1];
    const currentDate = normalized[index];
    const diff = differenceInCalendarDays(currentDate, previous);

    if (diff === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

export async function createDutyBooking(actorUserId: string, input: DutyBookingInput) {
  const parsed = dutyBookingSchema.parse(input);
  const { dayStart, nextDay } = dayRange(parsed.date);
  const settings = await getSettingsMap();

  const [closedDay, existingBooking, existingAssignment, recentBookings, preferredComplexity] =
    await Promise.all([
      db.lessonDay.findFirst({
        where: {
          groupId: parsed.groupId,
          date: {
            gte: dayStart,
            lt: nextDay,
          },
          status: "CLOSED",
        },
      }),
      db.dutyBooking.findFirst({
        where: {
          studentId: parsed.studentId,
          date: {
            gte: dayStart,
            lt: nextDay,
          },
          status: {
            in: ["ACTIVE", "USED"],
          },
        },
      }),
      db.dutyAssignment.findFirst({
        where: {
          assignedStudentId: parsed.studentId,
          date: {
            gte: dayStart,
            lt: nextDay,
          },
          status: {
            notIn: ["CANCELLED"],
          },
        },
      }),
      db.dutyBooking.findMany({
        where: {
          studentId: parsed.studentId,
          status: {
            in: ["ACTIVE", "USED"],
          },
          date: {
            gte: subDays(dayStart, settings.maxConsecutiveBookingDays),
            lte: addDays(dayStart, settings.maxConsecutiveBookingDays),
          },
        },
      }),
      parsed.preferredComplexityCode
        ? getComplexityByCode(parsed.preferredComplexityCode)
        : Promise.resolve(null),
    ]);

  if (closedDay) {
    throw new AppError("Нельзя забронировать дежурство на уже закрытый день.");
  }

  if (existingBooking || existingAssignment) {
    throw new AppError("На этот день уже есть бронь или назначение.");
  }

  const streak = calculateBookingStreak(
    recentBookings.map((booking) => booking.date),
    dayStart,
  );

  if (streak > settings.maxConsecutiveBookingDays) {
    throw new AppError(
      `Нельзя бронировать больше ${settings.maxConsecutiveBookingDays} дней подряд.`,
    );
  }

  const booking = await db.dutyBooking.create({
    data: {
      studentId: parsed.studentId,
      groupId: parsed.groupId,
      date: dayStart,
      preferredComplexityId: preferredComplexity?.id ?? null,
      comment: parsed.comment ?? null,
    },
  });

  await createAuditLog({
    actorUserId,
    action: "duty.booking.created",
    entityType: "DutyBooking",
    entityId: booking.id,
    after: booking,
  });

  return booking;
}

export async function deleteDutyAssignment(
  actorUserId: string,
  input: DeleteDutyAssignmentInput,
) {
  const parsed = deleteDutyAssignmentSchema.parse(input);

  const assignment = await db.dutyAssignment.findUnique({
    where: { id: parsed.assignmentId },
    include: {
      booking: true,
      evaluation: true,
      pointTransactions: {
        select: { id: true },
      },
      replacements: {
        select: { id: true },
      },
      relatedLessonPair: {
        select: {
          id: true,
          pairNumber: true,
          subject: true,
        },
      },
      assignedStudent: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError("Назначение дежурства не найдено.");
  }

  if (assignment.status !== "ASSIGNED") {
    throw new AppError("Удалять можно только активное, еще не закрытое назначение.");
  }

  if (
    assignment.evaluation ||
    assignment.pointTransactions.length > 0 ||
    assignment.replacements.length > 0
  ) {
    throw new AppError("Это назначение уже участвовало в оценке или начислении баллов, удалить его нельзя.");
  }

  await db.$transaction(async (transaction) => {
    if (assignment.bookingId) {
      await transaction.dutyBooking.update({
        where: { id: assignment.bookingId },
        data: {
          status: "ACTIVE",
        },
      });
    }

    await transaction.dutyAssignment.delete({
      where: { id: assignment.id },
    });
  });

  await createAuditLog({
    actorUserId,
    action: "duty.assignment.deleted",
    entityType: "DutyAssignment",
    entityId: assignment.id,
    before: assignment,
  });
}

export async function evaluateDutyAssignment(
  actorUserId: string,
  input: EvaluateDutyInput,
) {
  const parsed = evaluateDutySchema.parse(input);
  const settings = await getSettingsMap();

  const assignment = await db.dutyAssignment.findUnique({
    where: { id: parsed.assignmentId },
    include: {
      assignedStudent: {
        include: { user: true },
      },
      cleaningComplexity: true,
      evaluation: true,
    },
  });

  if (!assignment) {
    throw new AppError("Назначение на дежурство не найдено.");
  }

  if (assignment.evaluation) {
    throw new AppError("Оценка по этому дежурству уже выставлена.");
  }

  const finalStatus =
    parsed.replacementStudentId && parsed.replacementStudentId !== assignment.assignedStudentId
      ? "REPLACED"
      : parsed.markedRefusal
        ? "REFUSED"
        : parsed.markedEscape || parsed.quality === "NOT_DONE"
          ? "ESCAPED"
          : "COMPLETED";

  const createdStudentIds = [assignment.assignedStudentId];

  await db.$transaction(async (transaction) => {
    const teacherProfile = await transaction.teacherProfile.findUnique({
      where: { userId: actorUserId },
    });

    if (!teacherProfile) {
      throw new AppError("Для оценки требуется профиль преподавателя.");
    }

    await transaction.cleaningEvaluation.create({
      data: {
        dutyAssignmentId: assignment.id,
        teacherId: teacherProfile.id,
        replacementStudentId: parsed.replacementStudentId ?? null,
        quality: parsed.quality,
        comment: parsed.comment ?? null,
        penaltyApplied:
          parsed.quality === "UNSATISFACTORY" ||
          parsed.markedRefusal ||
          parsed.markedEscape ||
          parsed.quality === "NOT_DONE",
        markedRefusal: parsed.markedRefusal,
        markedEscape: parsed.markedEscape,
      },
    });

    const pointOperations: Promise<unknown>[] = [];
    let penaltyPoints = 0;
    let bonusPoints = 0;

      if (finalStatus === "COMPLETED") {
        pointOperations.push(
          createPointTransaction({
            tx: transaction,
            studentId: assignment.assignedStudentId,
            groupId: assignment.groupId,
            createdById: actorUserId,
          type: "DUTY_BASE",
          value: assignment.basePoints,
          relatedDutyAssignmentId: assignment.id,
          comment: "Завершенное дежурство",
        }),
      );
    }

      if (parsed.quality === "EXCELLENT") {
        bonusPoints += settings.qualityBonusValue;
        pointOperations.push(
          createPointTransaction({
            tx: transaction,
            studentId: assignment.assignedStudentId,
            groupId: assignment.groupId,
            createdById: actorUserId,
          type: "QUALITY_BONUS",
          value: settings.qualityBonusValue,
          relatedDutyAssignmentId: assignment.id,
          bonusReasonCode: "QUALITY_EXCELLENT",
          comment: "Отличное качество уборки",
        }),
      );
    }

      if (parsed.quality === "UNSATISFACTORY") {
        penaltyPoints += Math.abs(settings.qualityPenaltyValue);
        pointOperations.push(
          createPointTransaction({
            tx: transaction,
            studentId: assignment.assignedStudentId,
            groupId: assignment.groupId,
            createdById: actorUserId,
          type: "QUALITY_PENALTY",
          value: settings.qualityPenaltyValue,
          relatedDutyAssignmentId: assignment.id,
          penaltyReasonCode: "UNSATISFACTORY_CLEANING",
          comment: "Неудовлетворительная уборка",
        }),
      );
    }

      if (finalStatus === "REFUSED") {
        penaltyPoints += 2;
        pointOperations.push(
          createPointTransaction({
            tx: transaction,
            studentId: assignment.assignedStudentId,
            groupId: assignment.groupId,
            createdById: actorUserId,
          type: "PENALTY_REFUSAL",
          value: -2,
          relatedDutyAssignmentId: assignment.id,
          penaltyReasonCode: "REFUSAL",
          comment: "Отказ от дежурства",
        }),
      );
    }

      if (finalStatus === "ESCAPED") {
        penaltyPoints += 3;
        pointOperations.push(
          createPointTransaction({
            tx: transaction,
            studentId: assignment.assignedStudentId,
            groupId: assignment.groupId,
            createdById: actorUserId,
          type: "PENALTY_ESCAPE",
          value: -3,
          relatedDutyAssignmentId: assignment.id,
          penaltyReasonCode: "ESCAPE",
          comment: "Побег с дежурства",
        }),
      );
    }

      if (
        parsed.replacementStudentId &&
        parsed.replacementStudentId !== assignment.assignedStudentId
    ) {
      createdStudentIds.push(parsed.replacementStudentId);
      bonusPoints += assignment.cleaningComplexity.replacementBonus;

      await transaction.dutyReplacement.create({
        data: {
          assignmentId: assignment.id,
          originalStudentId: assignment.assignedStudentId,
          replacementStudentId: parsed.replacementStudentId,
          reason: parsed.comment ?? "Замена подтверждена преподавателем",
          approvedById: actorUserId,
          bonusPoints: assignment.cleaningComplexity.replacementBonus,
        },
      });

      pointOperations.push(
        createPointTransaction({
          tx: transaction,
          studentId: parsed.replacementStudentId,
          groupId: assignment.groupId,
          createdById: actorUserId,
          type: "DUTY_BONUS",
          value: assignment.cleaningComplexity.replacementBonus,
          relatedDutyAssignmentId: assignment.id,
          bonusReasonCode: "REPLACEMENT",
          comment: "Подмена на дежурстве",
        }),
      );
    }

    await Promise.all(pointOperations);

    await transaction.dutyAssignment.update({
      where: { id: assignment.id },
      data: {
        status: finalStatus,
        penaltyPoints,
        bonusPoints,
      },
    });
  });

  await refreshStudentMetrics(createdStudentIds);

  await createAuditLog({
    actorUserId,
    action: "duty.assignment.evaluated",
    entityType: "DutyAssignment",
    entityId: assignment.id,
    after: {
      quality: parsed.quality,
      status: finalStatus,
      replacementStudentId: parsed.replacementStudentId ?? null,
    },
  });
}

export async function getDutyPlanningData(groupId: string, date = new Date()) {
  const { dayStart, nextDay } = dayRange(date);

  const [complexities, bookings, assignments, lessonDay] = await Promise.all([
    db.cleaningComplexity.findMany({
      where: { active: true },
      orderBy: { basePoints: "asc" },
    }),
    db.dutyBooking.findMany({
      where: {
        groupId,
        date: {
          gte: dayStart,
          lt: nextDay,
        },
      },
      include: {
        student: {
          include: { user: true },
        },
        preferredComplexity: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.dutyAssignment.findMany({
      where: {
        groupId,
        date: {
          gte: dayStart,
          lt: nextDay,
        },
      },
      include: {
        assignedStudent: {
          include: { user: true },
        },
        cleaningComplexity: true,
        evaluation: true,
        relatedLessonPair: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.lessonDay.findFirst({
      where: {
        groupId,
        date: {
          gte: dayStart,
          lt: nextDay,
        },
      },
      include: {
        lessonPairs: {
          orderBy: { pairNumber: "asc" },
        },
      },
    }),
  ]);

  return {
    complexities,
    bookings,
    assignments,
    lessonPairs: lessonDay?.lessonPairs ?? [],
  };
}

export async function getDutyJournal(groupId: string) {
  return db.dutyAssignment.findMany({
    where: { groupId },
    include: {
      assignedStudent: {
        include: { user: true },
      },
      cleaningComplexity: true,
      evaluation: true,
      relatedLessonPair: true,
      replacements: {
        include: {
          replacementStudent: {
            include: { user: true },
          },
        },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
}

export async function getTeacherAssignmentsForDay(
  teacherUserId: string,
  date = new Date(),
) {
  const teacherProfile = await db.teacherProfile.findUnique({
    where: { userId: teacherUserId },
  });

  if (!teacherProfile) {
    return [];
  }

  const { dayStart, nextDay } = dayRange(date);

  const taughtPairs = await db.lessonPair.findMany({
    where: {
      teacherId: teacherProfile.id,
      lessonDay: {
        date: {
          gte: dayStart,
          lt: nextDay,
        },
      },
    },
    select: {
      id: true,
      groupId: true,
    },
  });

  const groupIds = [...new Set(taughtPairs.map((pair) => pair.groupId))];
  const pairIds = taughtPairs.map((pair) => pair.id);

  return db.dutyAssignment.findMany({
    where: {
      date: {
        gte: dayStart,
        lt: nextDay,
      },
      OR: [
        {
          relatedLessonPairId: {
            in: pairIds,
          },
        },
        {
          relatedLessonPairId: null,
          groupId: {
            in: groupIds,
          },
        },
      ],
    },
    include: {
      assignedStudent: {
        include: { user: true },
      },
      group: true,
      cleaningComplexity: true,
      evaluation: true,
      relatedLessonPair: true,
    },
    orderBy: [{ group: { name: "asc" } }, { createdAt: "asc" }],
  });
}
