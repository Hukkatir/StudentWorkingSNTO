import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/constants";

const loginSchema = z.object({
  identifier: z.string().min(2),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email или логин", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { identifier, password } = parsed.data;
        const normalized = identifier.trim().toLowerCase();

        const user = await db.user.findFirst({
          where: {
            OR: [{ email: normalized }, { login: normalized }],
            active: true,
          },
          include: {
            role: true,
            studentProfile: true,
            teacherProfile: true,
            memberships: {
              where: { active: true },
            },
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const primaryMembership =
          user.memberships.find((membership) => membership.isPrimary) ??
          user.memberships[0];

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role.code,
          roleLabel: ROLE_LABELS[user.role.code],
          groupIds: user.memberships.map((membership) => membership.groupId),
          primaryGroupId: primaryMembership?.groupId ?? user.studentProfile?.groupId ?? null,
          studentProfileId: user.studentProfile?.id ?? null,
          teacherProfileId: user.teacherProfile?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.roleLabel = user.roleLabel;
        token.groupIds = user.groupIds;
        token.primaryGroupId = user.primaryGroupId;
        token.studentProfileId = user.studentProfileId;
        token.teacherProfileId = user.teacherProfileId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub && token.role && token.roleLabel) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.roleLabel = token.roleLabel;
        session.user.groupIds = token.groupIds ?? [];
        session.user.primaryGroupId = token.primaryGroupId ?? null;
        session.user.studentProfileId = token.studentProfileId ?? null;
        session.user.teacherProfileId = token.teacherProfileId ?? null;
      }

      return session;
    },
  },
};
