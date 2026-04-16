import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prismaCliPath = path.join(rootDir, "node_modules", "prisma", "build", "index.js");
const nextCliPath = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");
const maxAttempts = Number(process.env.DB_READY_MAX_ATTEMPTS ?? 30);
const delayMs = Number(process.env.DB_READY_DELAY_MS ?? 2000);

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

async function main() {
  await waitForDatabase();
  await runNodeScript(prismaCliPath, ["migrate", "deploy"], "Prisma migrate deploy");
  await ensureSeedData();
  await runNodeScript(nextCliPath, ["start"], "Next.js start");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
