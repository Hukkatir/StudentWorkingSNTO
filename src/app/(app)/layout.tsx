import { AppShell } from "@/components/app-shell/app-shell";
import { requireSession } from "@/lib/auth/session";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <AppShell
      user={{
        fullName: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
    >
      {children}
    </AppShell>
  );
}
