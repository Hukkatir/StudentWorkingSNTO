import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prismaCliPath = path.join(rootDir, "node_modules", "prisma", "build", "index.js");
const nextCliPath = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");
const maxAttempts = Number(process.env.DB_READY_MAX_ATTEMPTS ?? 30);
const delayMs = Number(process.env.DB_READY_DELAY_MS ?? 2000);
const demoTeacherAccounts = [
  {
    fullName: "Антон Беляев",
    email: "teacher3@example.com",
    login: "teacher3",
    department: "Разработка ПО",
    title: "преподаватель",
  },
  {
    fullName: "Елена Соколова",
    email: "teacher4@example.com",
    login: "teacher4",
    department: "Математическое моделирование",
    title: "преподаватель",
  },
  {
    fullName: "Марина Власова",
    email: "teacher5@example.com",
    login: "teacher5",
    department: "Информационная безопасность",
    title: "преподаватель",
  },
  {
    fullName: "Дмитрий Кравченко",
    email: "teacher6@example.com",
    login: "teacher6",
    department: "Базы данных",
    title: "преподаватель",
  },
];

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function runNodeScript(scriptPath, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: rootDir,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${label} exited with signal ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`${label} exited with code ${code ?? "unknown"}`));
        return;
      }

      resolve();
    });
  });
}

async function waitForDatabase() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const prisma = new PrismaClient();

    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("Database connection is ready.");
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Database did not become ready after ${maxAttempts} attempts.`, {
          cause: error,
        });
      }

      console.log(
        `Database is not ready yet (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs}ms.`,
      );
    } finally {
      await prisma.$disconnect().catch(() => undefined);
    }

    await delay(delayMs);
  }
}

async function ensureSeedData() {
  const prisma = new PrismaClient();

  try {
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();

    if (userCount > 0 && roleCount > 0) {
      console.log(`Seed skipped: found ${userCount} user(s) in the database.`);
      return;
    }
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }

  console.log("Database is empty. Running prisma db seed.");
  await runNodeScript(prismaCliPath, ["db", "seed"], "Prisma seed");
}

async function ensureDemoTeacherProfiles() {
  const prisma = new PrismaClient();

  try {
    const teacherRole = await prisma.role.findUnique({
      where: { code: "TEACHER" },
    });

    if (!teacherRole) {
      return;
    }

    const passwordHash = await hash(process.env.SEED_DEFAULT_PASSWORD ?? "demo12345", 10);

    for (const account of demoTeacherAccounts) {
      const user = await prisma.user.upsert({
        where: { email: account.email },
        update: {
          fullName: account.fullName,
          login: account.login,
          active: true,
          roleId: teacherRole.id,
        },
        create: {
          fullName: account.fullName,
          email: account.email,
          login: account.login,
          passwordHash,
          active: true,
          roleId: teacherRole.id,
        },
      });

      await prisma.teacherProfile.upsert({
        where: { userId: user.id },
        update: {
          department: account.department,
          title: account.title,
        },
        create: {
          userId: user.id,
          department: account.department,
          title: account.title,
        },
      });
    }
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function syncTeacherLinks() {
  const prisma = new PrismaClient();

  try {
    const teacherProfiles = await prisma.teacherProfile.findMany({
      include: {
        user: true,
      },
    });

    const teacherMap = new Map(
      teacherProfiles.map((profile) => [normalizeName(profile.user.fullName), profile.id]),
    );

    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        teacherId: null,
      },
      select: {
        id: true,
        teacherName: true,
      },
    });

    for (const item of scheduleItems) {
      const teacherId = teacherMap.get(normalizeName(item.teacherName));

      if (!teacherId) {
        continue;
      }

      await prisma.scheduleItem.update({
        where: { id: item.id },
        data: { teacherId },
      });
    }

    const lessonPairs = await prisma.lessonPair.findMany({
      where: {
        teacherId: null,
      },
      select: {
        id: true,
        teacherName: true,
      },
    });

    for (const pair of lessonPairs) {
      const teacherId = teacherMap.get(normalizeName(pair.teacherName));

      if (!teacherId) {
        continue;
      }

      await prisma.lessonPair.update({
        where: { id: pair.id },
        data: { teacherId },
      });
    }
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function main() {
  await waitForDatabase();
  await runNodeScript(prismaCliPath, ["migrate", "deploy"], "Prisma migrate deploy");
  await ensureSeedData();
  await ensureDemoTeacherProfiles();
  await syncTeacherLinks();
  await runNodeScript(nextCliPath, ["start"], "Next.js start");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
