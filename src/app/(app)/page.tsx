import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { getDefaultRouteForRole } from "@/lib/auth/session";

export default async function AppHomePage() {
  const session = await requireSession();

  redirect(getDefaultRouteForRole(session.user.role));
}
