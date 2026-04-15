import { db } from "@/lib/db";

export async function getStudentProfileByUserId(userId: string) {
  return db.studentProfile.findUnique({
    where: { userId },
    include: {
      user: true,
      group: true,
    },
  });
}

export async function getGroupStudents(groupId: string) {
  return db.studentProfile.findMany({
    where: { groupId },
    include: {
      user: true,
    },
    orderBy: {
      user: {
        fullName: "asc",
      },
    },
  });
}

export async function refreshStudentMetrics(studentIds: string[]) {
  const uniqueIds = [...new Set(studentIds.filter(Boolean))];

  await Promise.all(
    uniqueIds.map(async (studentId) => {
      const [attendanceRecords, pointTransactions, assignments, replacements] =
        await Promise.all([
          db.attendanceRecord.findMany({
            where: {
              studentId,
              status: {
                in: ["ABSENT", "EXCUSED"],
              },
            },
            select: { id: true },
          }),
          db.pointTransaction.findMany({
            where: { studentId },
            select: { value: true },
          }),
          db.dutyAssignment.findMany({
            where: { assignedStudentId: studentId },
            select: { status: true },
          }),
          db.dutyReplacement.findMany({
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
      const totalDuties =
        assignments.filter((assignment) => assignment.status === "COMPLETED").length +
        replacements.length;

      await db.studentProfile.update({
        where: { id: studentId },
        data: {
          currentDutyScore,
          totalBonuses,
          totalPenalties,
          totalDuties,
          totalAbsences: attendanceRecords.length,
        },
      });
    }),
  );
}
