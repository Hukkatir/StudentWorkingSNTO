import type { DefaultSession } from "next-auth";
import type { RoleCode } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: RoleCode;
      roleLabel: string;
      groupIds: string[];
      primaryGroupId: string | null;
      studentProfileId: string | null;
      teacherProfileId: string | null;
    };
  }

  interface User {
    id: string;
    role: RoleCode;
    roleLabel: string;
    groupIds: string[];
    primaryGroupId: string | null;
    studentProfileId: string | null;
    teacherProfileId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: RoleCode;
    roleLabel?: string;
    groupIds?: string[];
    primaryGroupId?: string | null;
    studentProfileId?: string | null;
    teacherProfileId?: string | null;
  }
}
