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
      name: row.fullName.split(" ")[0],
      duties: row.completedDuties,
      balance: row.currentBalance,
    })),
    pointsChart: rows.map((row) => ({
      name: row.fullName.split(" ")[0],
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
        },
        orderBy: { date: "desc" },
      },
      replacementTargets: {
        include: {
          assignment: true,
        },
        orderBy: { createdAt: "desc" },
      },
      pointTransactions: {
        include: {
          bonusReason: true,
          penaltyReason: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    return null;
  }

  const values = student.pointTransactions.map((transaction) => transaction.value);
  const incidentCount = student.dutyAssignments.filter((assignment) =>
    ["REFUSED", "ESCAPED", "REPLACED"].includes(assignment.status),
  ).length;

  return {
    student,
    totals: {
      assigned: student.dutyAssignments.length,
      completed:
        student.dutyAssignments.filter((assignment) => assignment.status === "COMPLETED").length +
        student.replacementTargets.length,
      incidents: incidentCount,
      bonuses: sumPositive(values),
      penalties: sumNegative(values),
      balance: values.reduce((sum, value) => sum + value, 0),
    },
  };
}
