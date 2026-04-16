"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Home,
  Import,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_MONOGRAM, APP_NAME } from "@/lib/branding";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Role = "ADMIN" | "CURATOR" | "GROUP_MANAGER" | "TEACHER" | "STUDENT";

type AppShellProps = {
  user: {
    fullName?: string | null;
    email?: string | null;
    role: Role;
  };
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navMap: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Сводка", icon: ShieldCheck },
    { href: "/admin/groups", label: "Группы", icon: Users },
    { href: "/admin/students", label: "Студенты", icon: UserRound },
    { href: "/admin/imports", label: "Импорт", icon: Import },
    { href: "/admin/settings", label: "Правила", icon: Settings2 },
    { href: "/admin/audit", label: "Аудит", icon: ClipboardList },
  ],
  CURATOR: [
    { href: "/manager", label: "Сегодня", icon: Home },
    { href: "/manager/schedule", label: "Неделя", icon: CalendarDays },
    { href: "/manager/duties", label: "Дежурства", icon: Sparkles },
    { href: "/manager/statistics", label: "Статистика", icon: BarChart3 },
  ],
  GROUP_MANAGER: [
    { href: "/manager", label: "Сегодня", icon: Home },
    { href: "/manager/schedule", label: "Неделя", icon: CalendarDays },
    { href: "/manager/duties", label: "Дежурства", icon: Sparkles },
    { href: "/manager/statistics", label: "Статистика", icon: BarChart3 },
  ],
  TEACHER: [
    { href: "/teacher", label: "Сегодня", icon: Home },
    { href: "/teacher/evaluations", label: "Оценки", icon: Sparkles },
  ],
  STUDENT: [
    { href: "/student", label: "Мой день", icon: Home },
    { href: "/student/absences", label: "Отсутствия", icon: CalendarDays },
    { href: "/student/bookings", label: "Бронь", icon: Sparkles },
    { href: "/student/statistics", label: "Статистика", icon: BarChart3 },
  ],
};

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const navItems = navMap[user.role];
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.08),transparent_40%),linear-gradient(180deg,#f7f8f6_0%,#ffffff_28%,#f6f8fa_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),transparent_35%),linear-gradient(180deg,#13181c_0%,#161b20_40%,#101418_100%)]">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <aside
          className={cn(
            "hidden border-r border-border/70 bg-background/80 backdrop-blur md:flex md:min-h-screen md:flex-col md:gap-8 md:transition-[width,padding] md:duration-300",
            isSidebarCollapsed ? "md:w-24 md:px-3 md:py-4" : "md:w-72 md:p-6",
          )}
        >
          <div className="flex flex-col gap-8">
            <div
              className={cn(
                "flex gap-3",
                isSidebarCollapsed
                  ? "flex-col items-center"
                  : "items-start justify-between",
              )}
            >
              <div
                className={cn(
                  "flex flex-col gap-2",
                  isSidebarCollapsed && "items-center text-center",
                )}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300"
                  title={APP_NAME}
                >
                  {isSidebarCollapsed ? APP_MONOGRAM : APP_NAME}
                </span>
                {!isSidebarCollapsed ? (
                  <>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Кабинет группы
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Посещаемость, дежурства, бронь и статистика в одном кабинете.
                    </p>
                  </>
                ) : (
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    меню
                  </span>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 rounded-full"
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                aria-label={isSidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
                title={isSidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              </Button>
            </div>

            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    title={item.label}
                    className={cn(
                      "flex items-center rounded-2xl py-3 text-sm font-medium transition-colors",
                      isSidebarCollapsed ? "justify-center px-3" : "gap-3 px-4",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon />
                    <span className={cn("truncate", isSidebarCollapsed && "sr-only")}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/88 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">{user.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                <ThemeSwitcher />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "rounded-full",
                    )}
                  >
                    <UserRound />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Аккаунт</DropdownMenuLabel>
                      <DropdownMenuItem className="flex flex-col items-start">
                        <span className="font-medium">{user.fullName}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                        <LogOut data-icon="inline-start" />
                        Выйти
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 md:px-6 md:pb-8">
              {children}
            </div>
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-3 py-2 backdrop-blur md:hidden">
            <div className="grid grid-cols-4 gap-2">
              {navItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
