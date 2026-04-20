import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { db } from "@/lib/db";
import { getSettingsMap } from "@/lib/server/settings";

function sumPositive(values: number[]) {
  return values.filter((value) => value > 0).reduce((sum, value) => sum + value, 0);
}

function sumNegative(values: number[]) {
  return Math.abs(
    values.filter((value) => value < 0).reduce((sum, value) => sum + value, 0),
  );
}

function buildShortName(fullName: string) {
  return fullName.split(" ")[0] ?? fullName;
}

function buildTimelineLabel(value: Date) {
  return format(value, "d MMM", { locale: ru });
}

export async function getGroupStatistics(groupId: string) {
  const settings = await getSettingsMap();
  const students = await db.studentProfile.findMany({
    where: { groupId },
    include: {
      user: true,
      dutyAssignments: true,
      replacementTargets: true,
      pointTransactions: true,
    },
    orderBy: {
      user: {
        fullName: "asc",
      },
    },
  });

  const rows = students.map((student) => {
    const values = student.pointTransactions.map((transaction) => transaction.value);
    const incidents = student.dutyAssignments.filter((assignment) =>
      ["REFUSED", "ESCAPED", "REPLACED"].includes(assignment.status),
    ).length;
    const completedDuties =
      student.dutyAssignments.filter((assignment) => assignment.status === "COMPLETED").length +
      student.replacementTargets.length;
    const assignedCount = student.dutyAssignments.length;
    const currentBalance = values.reduce((sum, value) => sum + value, 0);

    return {
      studentId: student.id,
      fullName: student.user.fullName,
      completedDuties,
      assignedCount,
      refusalCount: student.dutyAssignments.filter((assignment) => assignment.status === "REFUSED")
        .length,
      escapeCount: student.dutyAssignments.filter((assignment) => assignment.status === "ESCAPED")
        .length,
      currentBalance,
      totalBonuses: sumPositive(values),
      totalPenalties: sumNegative(values),
      inRedZone:
        completedDuties === 0 ||
        currentBalance < 0 ||
        incidents >= settings.redZoneIncidentThreshold,
    };
  });

  return {
    rows,
    summary: {
      studentCount: rows.length,
      redZoneCount: rows.filter((row) => row.inRedZone).length,
      totalCompletedDuties: rows.reduce((sum, row) => sum + row.completedDuties, 0),
      totalBonuses: rows.reduce((sum, row) => sum + row.totalBonuses, 0),
      totalPenalties: rows.reduce((sum, row) => sum + row.totalPenalties, 0),
    },
    dutyChart: rows.map((row) => ({
      name: buildShortName(row.fullName),
      duties: row.completedDuties,
      balance: row.currentBalance,
    })),
    pointsChart: rows.map((row) => ({
      name: buildShortName(row.fullName),
      bonuses: row.totalBonuses,
      penalties: row.totalPenalties,
    })),
  };
}

export async function getStudentStatistics(studentId: string) {
  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      group: true,
      dutyAssignments: {
        include: {
          cleaningComplexity: true,
          evaluation: true,
          relatedLessonPair: {
            select: {
              pairNumber: true,
              subject: true,
            },
          },
          pointTransactions: {
            select: {
              value: true,
            },
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      },
      replacementTargets: {
        include: {
          assignment: {
            include: {
              relatedLessonPair: {
                select: {
                  pairNumber: true,
                  subject: true,
                },
              },
              cleaningComplexity: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      pointTransactions: {
        include: {
          bonusReason: true,
          penaltyReason: true,
          relatedDutyAssignment: {
            include: {
              relatedLessonPair: {
                select: {
                  pairNumber: true,
                  subject: true,
                },
              },
              cleaningComplexity: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    return null;
  }

  const groupPeers = await db.studentProfile.findMany({
    where: { groupId: student.groupId },
    select: {
      id: true,
      currentDutyScore: true,
    },
  });
  const values = student.pointTransactions.map((transaction) => transaction.value);
  const refusalCount = student.dutyAssignments.filter((assignment) => assignment.status === "REFUSED")
    .length;
  const escapeCount = student.dutyAssignments.filter((assignment) => assignment.status === "ESCAPED")
    .length;
  const replacementCount = student.replacementTargets.length;
  const completedAssignments = student.dutyAssignments.filter(
    (assignment) => assignment.status === "COMPLETED",
  ).length;
  const balance = values.reduce((sum, value) => sum + value, 0);
  const sortedPeers = [...groupPeers].sort(
    (left, right) => right.currentDutyScore - left.currentDutyScore,
  );
  const groupRank =
    sortedPeers.findIndex((peer) => peer.id === student.id) !== -1
      ? sortedPeers.findIndex((peer) => peer.id === student.id) + 1
      : null;
  const averageBalance = groupPeers.length
    ? Number(
        (
          groupPeers.reduce((sum, peer) => sum + peer.currentDutyScore, 0) / groupPeers.length
        ).toFixed(1),
      )
    : 0;

  const balanceTimeline = [...student.pointTransactions]
    .reverse()
    .reduce<
      Array<{
        label: string;
        balance: number;
        delta: number;
      }>
    >((accumulator, transaction) => {
      const previousBalance = accumulator[accumulator.length - 1]?.balance ?? 0;

      accumulator.push({
        label: buildTimelineLabel(transaction.createdAt),
        balance: previousBalance + transaction.value,
        delta: transaction.value,
      });

      return accumulator;
    }, [])
    .slice(-8);

  return {
    student: {
      id: student.id,
      fullName: student.user.fullName,
      groupName: student.group.name,
      currentDutyScore: student.currentDutyScore,
      totalDuties: student.totalDuties,
      totalBonuses: student.totalBonuses,
      totalPenalties: student.totalPenalties,
    },
    comparison: {
      groupRank,
      groupSize: groupPeers.length,
      averageBalance,
    },
    totals: {
      assigned: student.dutyAssignments.length,
      completed: completedAssignments + replacementCount,
      replacements: replacementCount,
      incidents: refusalCount + escapeCount,
      refusalCount,
      escapeCount,
      bonuses: sumPositive(values),
      penalties: sumNegative(values),
      balance,
    },
    statusChart: [
      { name: "Назначено", value: student.dutyAssignments.length },
      { name: "Завершено", value: completedAssignments },
      { name: "Замены", value: replacementCount },
      { name: "Отказы", value: refusalCount },
      { name: "Побеги", value: escapeCount },
    ],
    balanceTimeline,
    dutyHistory: student.dutyAssignments.slice(0, 10).map((assignment) => ({
      id: assignment.id,
      date: assignment.date,
      status: assignment.status,
      quality: assignment.evaluation?.quality ?? null,
      complexityLabel: assignment.cleaningComplexity.label,
      lessonLabel: assignment.relatedLessonPair
        ? `Пара ${assignment.relatedLessonPair.pairNumber}: ${assignment.relatedLessonPair.subject}`
        : "Дежурство на весь день",
      pointsDelta: assignment.pointTransactions.reduce(
        (sum, transaction) => sum + transaction.value,
        0,
      ),
    })),
    recentTransactions: student.pointTransactions.slice(0, 10).map((transaction) => ({
      id: transaction.id,
      createdAt: transaction.createdAt,
      type: transaction.type,
      value: transaction.value,
      comment: transaction.comment,
      contextLabel: transaction.relatedDutyAssignment
        ? transaction.relatedDutyAssignment.relatedLessonPair
          ? `Пара ${transaction.relatedDutyAssignment.relatedLessonPair.pairNumber}: ${transaction.relatedDutyAssignment.relatedLessonPair.subject}`
          : transaction.relatedDutyAssignment.cleaningComplexity.label
        : null,
    })),
  };
}
