import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { PwaProvider } from "@/components/providers/pwa-provider";
import { AppSessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentSession } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/branding";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Учет посещаемости, дежурств и баллов для студенческих групп.",
  manifest: "/manifest.webmanifest",
  applicationName: APP_NAME,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${manrope.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AppSessionProvider session={session}>
            <PwaProvider />
            {children}
            <Toaster richColors position="top-center" />
          </AppSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
