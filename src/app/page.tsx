import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/session";
import { getDefaultRouteForRole } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(getDefaultRouteForRole(session.user.role));
}
