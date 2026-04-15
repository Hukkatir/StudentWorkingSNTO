import type { RoleCode } from "@prisma/client";

export const ADMIN_ROLES: RoleCode[] = ["ADMIN"];
export const MANAGER_ROLES: RoleCode[] = ["ADMIN", "CURATOR", "GROUP_MANAGER"];
export const TEACHING_ROLES: RoleCode[] = ["ADMIN", "TEACHER"];
export const STUDENT_VISIBLE_ROLES: RoleCode[] = [
  "ADMIN",
  "CURATOR",
  "GROUP_MANAGER",
  "TEACHER",
  "STUDENT",
];

export function hasRole(role: RoleCode, allowed: RoleCode[]) {
  return allowed.includes(role);
}
