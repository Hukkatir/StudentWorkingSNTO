import { hash } from "bcryptjs";

import { createAuditLog } from "@/lib/audit";
import { APP_SETTING_DEFINITIONS, DEFAULT_APP_SETTINGS } from "@/lib/config/app-settings";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  CreateGroupInput,
  CreateStudentInput,
} from "@/modules/admin/schemas";

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

export async function createGroup(actorUserId: string, input: CreateGroupInput) {
  const exists = await db.group.findUnique({
    where: { name: input.name },
    select: { id: true },
  });

  if (exists) {
    throw new AppError("Группа с таким названием уже существует.");
  }

  const group = await db.group.create({
    data: {
      name: input.name,
      course: input.course,
      year: input.year,
      department: input.department || null,
      active: input.active,
    },
  });

  await createAuditLog({
    actorUserId,
    action: "admin.group.created",
    entityType: "Group",
    entityId: group.id,
    after: group,
  });

  return group;
}

export async function createStudent(actorUserId: string, input: CreateStudentInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedLogin = input.login.trim().toLowerCase();

  const [existingEmail, existingLogin, group, role] = await Promise.all([
    db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    }),
    db.user.findUnique({
      where: { login: normalizedLogin },
      select: { id: true },
    }),
    db.group.findUnique({
      where: { id: input.groupId },
      select: { id: true, name: true },
    }),
    db.role.findUnique({
      where: { code: "STUDENT" },
      select: { id: true },
    }),
  ]);

  if (existingEmail) {
    throw new AppError("Пользователь с такой почтой уже существует.");
  }

  if (existingLogin) {
    throw new AppError("Пользователь с таким логином уже существует.");
  }

  if (!group) {
    throw new AppError("Выбранная группа не найдена.");
  }

  if (!role) {
    throw new AppError("Системная роль студента не найдена.");
  }

  const passwordHash = await hash(input.password, 10);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        login: normalizedLogin,
        passwordHash,
        active: input.active,
        roleId: role.id,
      },
    });

    const studentProfile = await tx.studentProfile.create({
      data: {
        userId: user.id,
        groupId: group.id,
        studentNumber: input.studentNumber?.trim() || null,
      },
      include: {
        user: true,
        group: true,
      },
    });

    await tx.groupMembership.create({
      data: {
        userId: user.id,
        groupId: group.id,
        roleCode: "STUDENT",
        isPrimary: true,
        active: true,
      },
    });

    return studentProfile;
  });

  await createAuditLog({
    actorUserId,
    action: "admin.student.created",
    entityType: "StudentProfile",
    entityId: result.id,
    after: {
      studentId: result.id,
      fullName: result.user.fullName,
      email: result.user.email,
      login: result.user.login,
      groupId: result.groupId,
      groupName: result.group.name,
    },
  });

  return result;
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
    value: ((valueMap.get(definition.key)?.valueJson ??
      DEFAULT_APP_SETTINGS[definition.key]) as number | boolean),
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
