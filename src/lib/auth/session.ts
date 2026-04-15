import type { RoleCode } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { ROLE_HOME } from "@/lib/constants";
import { authOptions } from "@/lib/auth/options";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(allowedRoles: RoleCode[]) {
  const session = await requireSession();

  if (!allowedRoles.includes(session.user.role)) {
    redirect(ROLE_HOME[session.user.role]);
  }

  return session;
}

export function getDefaultRouteForRole(role: RoleCode) {
  return ROLE_HOME[role];
}
