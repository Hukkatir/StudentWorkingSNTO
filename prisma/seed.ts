import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay, startOfWeek, subDays } from "date-fns";

const prisma = new PrismaClient();

function atTime(baseDate: Date, startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function ensureLessonDay(
  prisma: PrismaClient,
  groupId: string,
  date: Date,
  closedById: string,
) {
  const normalizedDate = startOfDay(date);

  return prisma.lessonDay.upsert({
    where: {
      groupId_date: {
        groupId,
        date: normalizedDate,
      },
    },
    update: {
      status: normalizedDate < startOfDay(new Date()) ? "CLOSED" : "OPEN",
      closedAt: normalizedDate < startOfDay(new Date()) ? atTime(normalizedDate, "18:00") : null,
      closedById: normalizedDate < startOfDay(new Date()) ? closedById : null,
    },
    create: {
      groupId,
      date: normalizedDate,
      status: normalizedDate < startOfDay(new Date()) ? "CLOSED" : "OPEN",
      closedAt: normalizedDate < startOfDay(new Date()) ? atTime(normalizedDate, "18:00") : null,
      closedById: normalizedDate < startOfDay(new Date()) ? closedById : null,
    },
  });
}

async function refreshStudentMetrics(studentIds: string[]) {
  const uniqueIds = [...new Set(studentIds)];

  for (const studentId of uniqueIds) {
    const [attendanceRecords, pointTransactions, assignments, replacements] =
      await Promise.all([
        prisma.attendanceRecord.findMany({
          where: {
            studentId,
            status: {
              in: ["ABSENT", "EXCUSED"],
            },
          },
          select: { id: true },
        }),
        prisma.pointTransaction.findMany({
          where: { studentId },
          select: { value: true },
        }),
        prisma.dutyAssignment.findMany({
          where: { assignedStudentId: studentId },
          select: { status: true },
        }),
        prisma.dutyReplacement.findMany({
          where: { replacementStudentId: studentId },
          select: { id: true },
        }),
      ]);

    const currentDutyScore = pointTransactions.reduce(
      (sum, transaction) => sum + transaction.value,
      0,
    );
    const totalBonuses = pointTransactions
      .filter((transaction) => transaction.value > 0)
      .reduce((sum, transaction) => sum + transaction.value, 0);
    const totalPenalties = Math.abs(
      pointTransactions
        .filter((transaction) => transaction.value < 0)
        .reduce((sum, transaction) => sum + transaction.value, 0),
    );

    await prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        currentDutyScore,
        totalBonuses,
        totalPenalties,
        totalDuties:
          assignments.filter((assignment) => assignment.status === "COMPLETED").length +
          replacements.length,
        totalAbsences: attendanceRecords.length,
      },
    });
  }
}

async function main() {
  const password = await hash(process.env.SEED_DEFAULT_PASSWORD ?? "demo12345", 10);
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const today = startOfDay(new Date());

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.cleaningEvaluation.deleteMany();
  await prisma.dutyReplacement.deleteMany();
  await prisma.dutyAssignment.deleteMany();
  await prisma.dutyBooking.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.absenceRequest.deleteMany();
  await prisma.lessonPair.deleteMany();
  await prisma.lessonDay.deleteMany();
  await prisma.scheduleItem.deleteMany();
  await prisma.scheduleImport.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.absenceReason.deleteMany();
  await prisma.cleaningComplexity.deleteMany();
  await prisma.penaltyReason.deleteMany();
  await prisma.bonusReason.deleteMany();
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();
  await prisma.role.deleteMany();

  const roles = await prisma.role.createManyAndReturn({
    data: [
      { code: "ADMIN", name: "Администратор" },
      { code: "CURATOR", name: "Куратор" },
      { code: "GROUP_MANAGER", name: "Менеджер группы" },
      { code: "TEACHER", name: "Преподаватель" },
      { code: "STUDENT", name: "Студент" },
    ],
  });
  const roleMap = new Map(roles.map((role) => [role.code, role.id]));

  await prisma.absenceReason.createMany({
    data: [
      { code: "SICK", label: "Болезнь", sortOrder: 1 },
      { code: "FAMILY", label: "Семейные обстоятельства", sortOrder: 2 },
      { code: "PRACTICE", label: "Практика", sortOrder: 3 },
      { code: "UNKNOWN", label: "Неизвестно", sortOrder: 4 },
      { code: "OTHER", label: "Другое", sortOrder: 5 },
    ],
  });

  await prisma.cleaningComplexity.createMany({
    data: [
      { code: "LIGHT", label: "Легкая", basePoints: 1, replacementBonus: 1 },
      { code: "MODERATE", label: "Умеренная", basePoints: 2, replacementBonus: 1 },
      { code: "FULL", label: "Полная", basePoints: 3, replacementBonus: 2 },
    ],
  });

  await prisma.penaltyReason.createMany({
    data: [
      { code: "REFUSAL", label: "Отказ", defaultPoints: -2 },
      { code: "ESCAPE", label: "Побег", defaultPoints: -3 },
      { code: "UNSATISFACTORY_CLEANING", label: "Плохая уборка", defaultPoints: -1 },
      { code: "NO_SHOW", label: "Не вышел", defaultPoints: -3 },
      { code: "MANUAL", label: "Ручная корректировка", defaultPoints: -1 },
    ],
  });

  await prisma.bonusReason.createMany({
    data: [
      { code: "REPLACEMENT", label: "Подмена", defaultPoints: 1 },
      { code: "QUALITY_EXCELLENT", label: "Отличная уборка", defaultPoints: 1 },
      { code: "EXTRA_CLEANING", label: "Дополнительная уборка", defaultPoints: 2 },
      { code: "MANUAL", label: "Ручной бонус", defaultPoints: 1 },
    ],
  });

  await prisma.appSetting.createMany({
    data: [
      {
        key: "duty.lookbackDays",
        label: "Окно недавних дежурств",
        valueJson: 4,
      },
      {
        key: "redZone.incidentThreshold",
        label: "Порог красной зоны",
        valueJson: 2,
      },
      {
        key: "duty.maxConsecutiveBookingDays",
        label: "Лимит подряд идущих бронирований",
        valueJson: 2,
      },
      {
        key: "absence.autoApproval",
        label: "Автоодобрение отсутствий",
        valueJson: true,
      },
      {
        key: "points.qualityPenaltyValue",
        label: "Штраф за плохую уборку",
        valueJson: -1,
      },
      {
        key: "points.qualityBonusValue",
        label: "Бонус за отличную уборку",
        valueJson: 1,
      },
    ],
  });

  const [groupIS, groupPM] = await prisma.group.createManyAndReturn({
    data: [
      { name: "ИС-21", course: 2, year: 2026, department: "Информатика" },
      { name: "ПМ-22", course: 3, year: 2026, department: "Прикладная математика" },
    ],
  });

  const adminUser = await prisma.user.create({
    data: {
      fullName: "Админ Системы",
      email: "admin@example.com",
      login: "admin",
      passwordHash: password,
      roleId: roleMap.get("ADMIN")!,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      fullName: "Анна Старостина",
      email: "manager@example.com",
      login: "manager",
      passwordHash: password,
      roleId: roleMap.get("GROUP_MANAGER")!,
    },
  });

  const curatorUser = await prisma.user.create({
    data: {
      fullName: "Олег Куратор",
      email: "curator@example.com",
      login: "curator",
      passwordHash: password,
      roleId: roleMap.get("CURATOR")!,
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      fullName: "Ирина Петрова",
      email: "teacher@example.com",
      login: "teacher",
      passwordHash: password,
      roleId: roleMap.get("TEACHER")!,
    },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      fullName: "Сергей Лавров",
      email: "teacher2@example.com",
      login: "teacher2",
      passwordHash: password,
      roleId: roleMap.get("TEACHER")!,
    },
  });

  const teacherProfile = await prisma.teacherProfile.create({
    data: {
      userId: teacherUser.id,
      department: "Информатика",
      title: "доцент",
    },
  });

  const teacherProfile2 = await prisma.teacherProfile.create({
    data: {
      userId: teacherUser2.id,
      department: "Математика",
      title: "старший преподаватель",
    },
  });

  await prisma.groupMembership.createMany({
    data: [
      {
        userId: managerUser.id,
        groupId: groupIS.id,
        roleCode: "GROUP_MANAGER",
        isPrimary: true,
      },
      {
        userId: curatorUser.id,
        groupId: groupPM.id,
        roleCode: "CURATOR",
        isPrimary: true,
      },
      {
        userId: teacherUser.id,
        groupId: groupIS.id,
        roleCode: "TEACHER",
        isPrimary: true,
      },
      {
        userId: teacherUser2.id,
        groupId: groupPM.id,
        roleCode: "TEACHER",
        isPrimary: true,
      },
    ],
  });

  const group1Students = await Promise.all(
    [
      "Иван Петров",
      "Мария Смирнова",
      "Егор Волков",
      "Дарья Никитина",
      "Павел Орлов",
      "София Белова",
    ].map((fullName, index) =>
      prisma.user.create({
        data: {
          fullName,
          email: `is${index + 1}@example.com`,
          login: `is${index + 1}`,
          passwordHash: password,
          roleId: roleMap.get("STUDENT")!,
        },
      }),
    ),
  );

  const group2Students = await Promise.all(
    ["Никита Громов", "Алина Лукина", "Роман Савельев", "Виктория Зорина"].map(
      (fullName, index) =>
        prisma.user.create({
          data: {
            fullName,
            email: `pm${index + 1}@example.com`,
            login: `pm${index + 1}`,
            passwordHash: password,
            roleId: roleMap.get("STUDENT")!,
          },
        }),
    ),
  );

  const studentProfiles = await Promise.all(
    group1Students.map((user, index) =>
      prisma.studentProfile.create({
        data: {
          userId: user.id,
          groupId: groupIS.id,
          studentNumber: `IS-${index + 1}`,
          isMonitor: index === 0,
          isAttendanceManager: index === 0,
          isDeputy: index === 1,
        },
      }),
    ),
  );

  const studentProfiles2 = await Promise.all(
    group2Students.map((user, index) =>
      prisma.studentProfile.create({
        data: {
          userId: user.id,
          groupId: groupPM.id,
          studentNumber: `PM-${index + 1}`,
          isMonitor: index === 0,
        },
      }),
    ),
  );

  await prisma.groupMembership.createMany({
    data: [
      ...group1Students.map((user) => ({
        userId: user.id,
        groupId: groupIS.id,
        roleCode: "STUDENT" as const,
        isPrimary: true,
      })),
      ...group2Students.map((user) => ({
        userId: user.id,
        groupId: groupPM.id,
        roleCode: "STUDENT" as const,
        isPrimary: true,
      })),
    ],
  });

  const scheduleImport = await prisma.scheduleImport.create({
    data: {
      adapterKey: "mock",
      sourceFilename: "demo-schedule.json",
      rawPayload: "seeded",
      importedById: adminUser.id,
      status: "CONFIRMED",
      confirmedAt: new Date(),
      itemCount: 0,
    },
  });

  const scheduleTemplates = [
    { pairNumber: 1, subject: "Базы данных", startTime: "08:30", endTime: "10:00" },
    { pairNumber: 2, subject: "Веб-разработка", startTime: "10:10", endTime: "11:40" },
    { pairNumber: 3, subject: "Алгоритмы", startTime: "12:10", endTime: "13:40" },
  ];

  for (const dayDate of [0, 1, 2, 3, 4].map((index) => addDays(monday, index))) {
    const lessonDay1 = await prisma.lessonDay.create({
      data: {
        groupId: groupIS.id,
        date: startOfDay(dayDate),
        status: dayDate < today ? "CLOSED" : "OPEN",
        closedAt: dayDate < today ? atTime(dayDate, "18:00") : null,
        closedById: dayDate < today ? managerUser.id : null,
      },
    });
    const lessonDay2 = await prisma.lessonDay.create({
      data: {
        groupId: groupPM.id,
        date: startOfDay(dayDate),
        status: dayDate < today ? "CLOSED" : "OPEN",
        closedAt: dayDate < today ? atTime(dayDate, "18:00") : null,
        closedById: dayDate < today ? curatorUser.id : null,
      },
    });

    for (const template of scheduleTemplates) {
      const scheduleItem1 = await prisma.scheduleItem.create({
        data: {
          groupId: groupIS.id,
          date: startOfDay(dayDate),
          pairNumber: template.pairNumber,
          subject: template.subject,
          teacherName: teacherUser.fullName,
          teacherId: teacherProfile.id,
          room: `A-${101 + template.pairNumber}`,
          startTime: template.startTime,
          endTime: template.endTime,
          sourceImportId: scheduleImport.id,
        },
      });

      const scheduleItem2 = await prisma.scheduleItem.create({
        data: {
          groupId: groupPM.id,
          date: startOfDay(dayDate),
          pairNumber: template.pairNumber,
          subject: template.subject === "Базы данных" ? "Теория вероятностей" : template.subject,
          teacherName: teacherUser2.fullName,
          teacherId: teacherProfile2.id,
          room: `B-${201 + template.pairNumber}`,
          startTime: template.startTime,
          endTime: template.endTime,
          sourceImportId: scheduleImport.id,
        },
      });

      await prisma.lessonPair.create({
        data: {
          groupId: groupIS.id,
          lessonDayId: lessonDay1.id,
          scheduleItemId: scheduleItem1.id,
          pairNumber: template.pairNumber,
          subject: template.subject,
          teacherName: teacherUser.fullName,
          teacherId: teacherProfile.id,
          room: `A-${101 + template.pairNumber}`,
          startTime: template.startTime,
          endTime: template.endTime,
        },
      });

      await prisma.lessonPair.create({
        data: {
          groupId: groupPM.id,
          lessonDayId: lessonDay2.id,
          scheduleItemId: scheduleItem2.id,
          pairNumber: template.pairNumber,
          subject: template.subject === "Базы данных" ? "Теория вероятностей" : template.subject,
          teacherName: teacherUser2.fullName,
          teacherId: teacherProfile2.id,
          room: `B-${201 + template.pairNumber}`,
          startTime: template.startTime,
          endTime: template.endTime,
        },
      });
    }
  }

  const sicknessReason = await prisma.absenceReason.findUniqueOrThrow({
    where: { code: "SICK" },
  });
  const familyReason = await prisma.absenceReason.findUniqueOrThrow({
    where: { code: "FAMILY" },
  });
  const moderateComplexity = await prisma.cleaningComplexity.findUniqueOrThrow({
    where: { code: "MODERATE" },
  });
  const fullComplexity = await prisma.cleaningComplexity.findUniqueOrThrow({
    where: { code: "FULL" },
  });
  const lightComplexity = await prisma.cleaningComplexity.findUniqueOrThrow({
    where: { code: "LIGHT" },
  });
  const refusalPenalty = await prisma.penaltyReason.findUniqueOrThrow({
    where: { code: "REFUSAL" },
  });
  const escapePenalty = await prisma.penaltyReason.findUniqueOrThrow({
    where: { code: "ESCAPE" },
  });
  const replacementBonus = await prisma.bonusReason.findUniqueOrThrow({
    where: { code: "REPLACEMENT" },
  });
  const qualityBonus = await prisma.bonusReason.findUniqueOrThrow({
    where: { code: "QUALITY_EXCELLENT" },
  });

  const todayLessonDay = await prisma.lessonDay.findFirstOrThrow({
    where: { groupId: groupIS.id, date: today },
    include: {
      lessonPairs: {
        include: { scheduleItem: true },
        orderBy: { pairNumber: "asc" },
      },
    },
  });

  await prisma.absenceRequest.create({
    data: {
      studentId: studentProfiles[2].id,
      groupId: groupIS.id,
      type: "DAY",
      date: today,
      reasonId: sicknessReason.id,
      status: "AUTO_REGISTERED",
      autoApplied: true,
      approvedById: managerUser.id,
      reviewedAt: new Date(),
      comment: "Температура, предупредил заранее",
    },
  });

  await prisma.absenceRequest.create({
    data: {
      studentId: studentProfiles[3].id,
      groupId: groupIS.id,
      type: "LESSON",
      date: today,
      lessonPairId: todayLessonDay.lessonPairs[2].id,
      scheduleItemId: todayLessonDay.lessonPairs[2].scheduleItemId!,
      reasonId: familyReason.id,
      status: "AUTO_REGISTERED",
      autoApplied: true,
      approvedById: managerUser.id,
      reviewedAt: new Date(),
      comment: "Срочные семейные обстоятельства",
    },
  });

  await prisma.attendanceRecord.createMany({
    data: [
      {
        studentId: studentProfiles[0].id,
        groupId: groupIS.id,
        scheduleItemId: todayLessonDay.lessonPairs[0].scheduleItemId!,
        lessonPairId: todayLessonDay.lessonPairs[0].id,
        status: "PRESENT",
        createdById: managerUser.id,
        updatedById: managerUser.id,
      },
      {
        studentId: studentProfiles[1].id,
        groupId: groupIS.id,
        scheduleItemId: todayLessonDay.lessonPairs[0].scheduleItemId!,
        lessonPairId: todayLessonDay.lessonPairs[0].id,
        status: "LATE",
        createdById: managerUser.id,
        updatedById: managerUser.id,
      },
      {
        studentId: studentProfiles[2].id,
        groupId: groupIS.id,
        scheduleItemId: todayLessonDay.lessonPairs[0].scheduleItemId!,
        lessonPairId: todayLessonDay.lessonPairs[0].id,
        status: "EXCUSED",
        reasonId: sicknessReason.id,
        createdById: managerUser.id,
        updatedById: managerUser.id,
      },
      {
        studentId: studentProfiles[3].id,
        groupId: groupIS.id,
        scheduleItemId: todayLessonDay.lessonPairs[0].scheduleItemId!,
        lessonPairId: todayLessonDay.lessonPairs[0].id,
        status: "PRESENT",
        createdById: managerUser.id,
        updatedById: managerUser.id,
      },
      {
        studentId: studentProfiles[4].id,
        groupId: groupIS.id,
        scheduleItemId: todayLessonDay.lessonPairs[0].scheduleItemId!,
        lessonPairId: todayLessonDay.lessonPairs[0].id,
        status: "PRESENT",
        createdById: managerUser.id,
        updatedById: managerUser.id,
      },
      {
        studentId: studentProfiles[5].id,
        groupId: groupIS.id,
        scheduleItemId: todayLessonDay.lessonPairs[0].scheduleItemId!,
        lessonPairId: todayLessonDay.lessonPairs[0].id,
        status: "PRESENT",
        createdById: managerUser.id,
        updatedById: managerUser.id,
      },
    ],
  });

  const booking = await prisma.dutyBooking.create({
    data: {
      studentId: studentProfiles[0].id,
      groupId: groupIS.id,
      date: today,
      preferredComplexityId: moderateComplexity.id,
      comment: "Готов взять дежурство после второй пары",
    },
  });

  await prisma.dutyBooking.create({
    data: {
      studentId: studentProfiles[1].id,
      groupId: groupIS.id,
      date: addDays(today, 1),
      preferredComplexityId: lightComplexity.id,
      comment: "Подойдет легкая уборка",
    },
  });

  const todayAssignment = await prisma.dutyAssignment.create({
    data: {
      groupId: groupIS.id,
      date: today,
      relatedLessonDayId: todayLessonDay.id,
      relatedLessonPairId: todayLessonDay.lessonPairs[1]?.id ?? null,
      assignedStudentId: studentProfiles[0].id,
      assignedById: managerUser.id,
      bookingId: booking.id,
      assignmentMode: "BOOKED",
      status: "ASSIGNED",
      cleaningComplexityId: moderateComplexity.id,
      basePoints: moderateComplexity.basePoints,
    },
  });

  await prisma.dutyAssignment.create({
    data: {
      groupId: groupIS.id,
      date: today,
      relatedLessonDayId: todayLessonDay.id,
      relatedLessonPairId: todayLessonDay.lessonPairs[2]?.id ?? null,
      assignedStudentId: studentProfiles[1].id,
      assignedById: managerUser.id,
      assignmentMode: "AUTO",
      status: "ASSIGNED",
      cleaningComplexityId: moderateComplexity.id,
      basePoints: moderateComplexity.basePoints,
    },
  });

  await prisma.dutyBooking.update({
    where: { id: booking.id },
    data: { status: "USED", usedInAssignment: { connect: { id: todayAssignment.id } } },
  });

  const yesterdayDay = await ensureLessonDay(
    prisma,
    groupIS.id,
    subDays(today, 1),
    managerUser.id,
  );

  const completedAssignment = await prisma.dutyAssignment.create({
    data: {
      groupId: groupIS.id,
      date: subDays(today, 1),
      relatedLessonDayId: yesterdayDay.id,
      assignedStudentId: studentProfiles[1].id,
      assignedById: managerUser.id,
      assignmentMode: "AUTO",
      status: "COMPLETED",
      cleaningComplexityId: moderateComplexity.id,
      basePoints: moderateComplexity.basePoints,
      bonusPoints: 1,
    },
  });

  await prisma.cleaningEvaluation.create({
    data: {
      dutyAssignmentId: completedAssignment.id,
      teacherId: teacherProfile.id,
      quality: "EXCELLENT",
      comment: "Кабинет сдан идеально",
      penaltyApplied: false,
    },
  });

  await prisma.pointTransaction.createMany({
    data: [
      {
        studentId: studentProfiles[1].id,
        groupId: groupIS.id,
        type: "DUTY_BASE",
        value: 2,
        relatedDutyAssignmentId: completedAssignment.id,
        createdById: teacherUser.id,
      },
      {
        studentId: studentProfiles[1].id,
        groupId: groupIS.id,
        type: "QUALITY_BONUS",
        value: 1,
        relatedDutyAssignmentId: completedAssignment.id,
        bonusReasonId: qualityBonus.id,
        createdById: teacherUser.id,
      },
    ],
  });

  const refusalAssignment = await prisma.dutyAssignment.create({
    data: {
      groupId: groupIS.id,
      date: subDays(today, 3),
      relatedLessonDayId: (
        await ensureLessonDay(prisma, groupIS.id, subDays(today, 3), managerUser.id)
      ).id,
      assignedStudentId: studentProfiles[2].id,
      assignedById: managerUser.id,
      assignmentMode: "AUTO",
      status: "REFUSED",
      cleaningComplexityId: lightComplexity.id,
      basePoints: lightComplexity.basePoints,
      penaltyPoints: 2,
    },
  });

  await prisma.pointTransaction.create({
    data: {
      studentId: studentProfiles[2].id,
      groupId: groupIS.id,
      type: "PENALTY_REFUSAL",
      value: -2,
      relatedDutyAssignmentId: refusalAssignment.id,
      penaltyReasonId: refusalPenalty.id,
      createdById: managerUser.id,
    },
  });

  const replacedAssignment = await prisma.dutyAssignment.create({
    data: {
      groupId: groupIS.id,
      date: subDays(today, 4),
      relatedLessonDayId: (
        await ensureLessonDay(prisma, groupIS.id, subDays(today, 4), managerUser.id)
      ).id,
      assignedStudentId: studentProfiles[3].id,
      assignedById: managerUser.id,
      assignmentMode: "AUTO",
      status: "REPLACED",
      cleaningComplexityId: fullComplexity.id,
      basePoints: fullComplexity.basePoints,
      penaltyPoints: 3,
      bonusPoints: 2,
    },
  });

  await prisma.cleaningEvaluation.create({
    data: {
      dutyAssignmentId: replacedAssignment.id,
      teacherId: teacherProfile.id,
      replacementStudentId: studentProfiles[4].id,
      quality: "NOT_DONE",
      comment: "Назначенный дежурный ушел, уборку забрал другой студент",
      penaltyApplied: true,
      markedEscape: true,
    },
  });

  await prisma.dutyReplacement.create({
    data: {
      assignmentId: replacedAssignment.id,
      originalStudentId: studentProfiles[3].id,
      replacementStudentId: studentProfiles[4].id,
      reason: "Подмена после побега",
      approvedById: teacherUser.id,
      bonusPoints: 2,
    },
  });

  await prisma.pointTransaction.createMany({
    data: [
      {
        studentId: studentProfiles[3].id,
        groupId: groupIS.id,
        type: "PENALTY_ESCAPE",
        value: -3,
        relatedDutyAssignmentId: replacedAssignment.id,
        penaltyReasonId: escapePenalty.id,
        createdById: teacherUser.id,
      },
      {
        studentId: studentProfiles[4].id,
        groupId: groupIS.id,
        type: "DUTY_BONUS",
        value: 2,
        relatedDutyAssignmentId: replacedAssignment.id,
        bonusReasonId: replacementBonus.id,
        createdById: teacherUser.id,
      },
    ],
  });

  const group2Day = await ensureLessonDay(
    prisma,
    groupPM.id,
    subDays(today, 2),
    curatorUser.id,
  );

  const group2Assignment = await prisma.dutyAssignment.create({
    data: {
      groupId: groupPM.id,
      date: subDays(today, 2),
      relatedLessonDayId: group2Day.id,
      assignedStudentId: studentProfiles2[0].id,
      assignedById: curatorUser.id,
      assignmentMode: "MANUAL",
      status: "COMPLETED",
      cleaningComplexityId: lightComplexity.id,
      basePoints: lightComplexity.basePoints,
    },
  });

  await prisma.cleaningEvaluation.create({
    data: {
      dutyAssignmentId: group2Assignment.id,
      teacherId: teacherProfile2.id,
      quality: "GOOD",
      comment: "Уборка выполнена без замечаний",
      penaltyApplied: false,
    },
  });

  await prisma.pointTransaction.create({
    data: {
      studentId: studentProfiles2[0].id,
      groupId: groupPM.id,
      type: "DUTY_BASE",
      value: 1,
      relatedDutyAssignmentId: group2Assignment.id,
      createdById: teacherUser2.id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: managerUser.id,
        title: "Импорт расписания завершен",
        body: "Demo-расписание загружено и готово к работе.",
        type: "SUCCESS",
        href: "/admin/imports",
      },
      {
        userId: studentProfiles[2].userId,
        title: "Заявка на отсутствие учтена",
        body: "Отсутствие на сегодня автоматически зарегистрировано.",
        type: "INFO",
        href: "/student/absences",
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: adminUser.id,
        action: "seed.schedule.created",
        entityType: "ScheduleImport",
        entityId: scheduleImport.id,
      },
      {
        actorUserId: managerUser.id,
        action: "seed.duties.created",
        entityType: "DutyAssignment",
        entityId: todayAssignment.id,
      },
    ],
  });

  await refreshStudentMetrics([
    ...studentProfiles.map((student) => student.id),
    ...studentProfiles2.map((student) => student.id),
  ]);

  console.log("Seed complete");
  console.log("Admin: admin@example.com / demo12345");
  console.log("Manager: manager@example.com / demo12345");
  console.log("Teacher: teacher@example.com / demo12345");
  console.log("Student: is1@example.com / demo12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
