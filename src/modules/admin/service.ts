import { APP_SETTING_DEFINITIONS, DEFAULT_APP_SETTINGS } from "@/lib/config/app-settings";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

export async function getAdminDashboardData() {
  const [groups, students, teachers, dutyAssignments, absenceRequests] = await Promise.all([
    db.group.count({ where: { active: true } }),
    db.studentProfile.count(),
    db.teacherProfile.count(),
    db.dutyAssignment.count(),
    db.absenceRequest.count({
      where: {
        status: "PENDING",
      },
    }),
  ]);

  return {
    groups,
    students,
    teachers,
    dutyAssignments,
    pendingAbsenceRequests: absenceRequests,
  };
}

export async function listAdminGroups() {
  return db.group.findMany({
    include: {
      _count: {
        select: {
          studentProfiles: true,
          lessonDays: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function listAdminStudents() {
  return db.studentProfile.findMany({
    include: {
      user: true,
      group: true,
    },
    orderBy: [{ group: { name: "asc" } }, { user: { fullName: "asc" } }],
  });
}

export async function getAuditLogEntries() {
  return db.auditLog.findMany({
    include: {
      actorUser: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getSettingsWithValues() {
  const records = await db.appSetting.findMany({
    orderBy: { key: "asc" },
  });
  const valueMap = new Map(records.map((record) => [record.key, record]));

  return APP_SETTING_DEFINITIONS.map((definition) => ({
    ...definition,
    value: ((
      valueMap.get(definition.key)?.valueJson ??
      DEFAULT_APP_SETTINGS[definition.key]
    ) as number | boolean),
  }));
}

export async function updateSettings(
  actorUserId: string,
  values: Record<string, boolean | number>,
) {
  const beforeState = await db.appSetting.findMany();

  await db.$transaction(
    Object.entries(values).map(([key, value]) =>
      db.appSetting.upsert({
        where: { key },
        update: {
          valueJson: value,
          updatedById: actorUserId,
        },
        create: {
          key,
          label: key,
          valueJson: value,
          updatedById: actorUserId,
        },
      }),
    ),
  );

  const afterState = await db.appSetting.findMany();

  await createAuditLog({
    actorUserId,
    action: "admin.settings.updated",
    entityType: "AppSetting",
    entityId: "batch",
    before: beforeState,
    after: afterState,
  });
}
