import { addDays, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import type { RoleCode } from "@prisma/client";

import { db } from "@/lib/db";

export async function getAccessibleGroups(userId: string, role: RoleCode) {
  if (role === "ADMIN") {
    return db.group.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }

  const memberships = await db.groupMembership.findMany({
    where: { userId, active: true },
    include: {
      group: true,
    },
    orderBy: {
      group: {
        name: "asc",
      },
    },
  });

  return memberships.map((membership) => membership.group);
}

export async function getGroupById(groupId: string) {
  return db.group.findUnique({
    where: { id: groupId },
  });
}

export async function getWeeklySchedule(groupId: string, currentDate = new Date()) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  return db.lessonDay.findMany({
    where: {
      groupId,
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      lessonPairs: {
        orderBy: { pairNumber: "asc" },
      },
    },
    orderBy: { date: "asc" },
  });
}

export async function getGroupDashboard(groupId: string, date = new Date()) {
  const dayStart = startOfDay(date);
  const nextDay = addDays(dayStart, 1);

  const [group, today, absenceRequests, bookings, assignments] = await Promise.all([
    db.group.findUnique({
      where: { id: groupId },
      include: {
        studentProfiles: {
          include: { user: true },
        },
      },
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
          include: {
            attendanceRecords: true,
          },
          orderBy: { pairNumber: "asc" },
        },
      },
    }),
    db.absenceRequest.count({
      where: {
        groupId,
        date: {
          gte: dayStart,
          lt: nextDay,
        },
      },
    }),
    db.dutyBooking.count({
      where: {
        groupId,
        date: {
          gte: dayStart,
          lt: nextDay,
        },
        status: "ACTIVE",
      },
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
        relatedLessonPair: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    group,
    today,
    absenceRequests,
    bookings,
    assignments,
  };
}
