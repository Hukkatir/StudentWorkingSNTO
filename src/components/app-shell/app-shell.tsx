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

import { BrandLogo } from "@/components/shared/brand-logo";
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
import { APP_SHORT_TAGLINE } from "@/lib/branding";
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
    { href: "/manager", label: "День", icon: Home },
    { href: "/manager/schedule", label: "Расписание", icon: CalendarDays },
    { href: "/manager/duties", label: "Дежурства", icon: Sparkles },
    { href: "/manager/statistics", label: "Статистика", icon: BarChart3 },
  ],
  GROUP_MANAGER: [
    { href: "/manager", label: "День", icon: Home },
    { href: "/manager/schedule", label: "Расписание", icon: CalendarDays },
    { href: "/manager/duties", label: "Дежурства", icon: Sparkles },
    { href: "/manager/statistics", label: "Статистика", icon: BarChart3 },
  ],
  TEACHER: [
    { href: "/teacher", label: "День", icon: Home },
    { href: "/teacher/evaluations", label: "Оценки", icon: Sparkles },
  ],
  STUDENT: [
    { href: "/student", label: "Мой день", icon: Home },
    { href: "/student/schedule", label: "Расписание", icon: CalendarDays },
    { href: "/student/absences", label: "Отсутствия", icon: ClipboardList },
    { href: "/student/bookings", label: "Бронь", icon: Sparkles },
    { href: "/student/statistics", label: "Статистика", icon: BarChart3 },
  ],
};

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const navItems = navMap[user.role];
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mobileNavItems = navItems.slice(0, user.role === "STUDENT" ? 5 : 4);
  const activeHref =
    navItems
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((left, right) => right.href.length - left.href.length)[0]?.href ?? null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,136,130,0.12),transparent_34%),linear-gradient(180deg,#f7fbfa_0%,#ffffff_32%,#f3f8f7_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(0,136,130,0.18),transparent_32%),linear-gradient(180deg,#0d1414_0%,#101919_38%,#0a1111_100%)]">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <aside
          className={cn(
            "hidden border-r border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.94))] backdrop-blur-xl md:sticky md:top-0 md:flex md:h-[100dvh] md:shrink-0 md:self-start md:flex-col md:justify-between md:gap-4 md:overflow-hidden md:transition-[width,padding] md:duration-300 dark:bg-[linear-gradient(180deg,rgba(14,23,22,0.94),rgba(11,17,17,0.98))]",
            isSidebarCollapsed ? "md:w-24 md:px-3 md:py-4" : "md:w-72 md:px-5 md:py-6",
          )}
        >
          <div className="relative flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

            <div
              className={cn(
                "flex gap-3 pt-2",
                isSidebarCollapsed ? "flex-col items-center" : "items-start",
              )}
            >
              <div
                className={cn(
                  "flex flex-col gap-2",
                  isSidebarCollapsed && "items-center text-center",
                )}
              >
                <BrandLogo
                  variant={isSidebarCollapsed ? "mark" : "horizontal"}
                  subtitle={isSidebarCollapsed ? null : APP_SHORT_TAGLINE}
                  className={cn(isSidebarCollapsed && "items-center")}
                  markClassName={isSidebarCollapsed ? "size-11" : "size-12"}
                  nameClassName={isSidebarCollapsed ? undefined : "text-xl"}
                  subtitleClassName={isSidebarCollapsed ? undefined : "text-[9px]"}
                />
                {!isSidebarCollapsed ? (
                  <>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      Управление группой
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Посещаемость, дежурства и статистика в одном месте.
                    </p>
                  </>
                ) : (
                  <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    меню
                  </span>
                )}
              </div>
            </div>

            <nav className="flex flex-col gap-2.5 pb-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeHref === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    title={item.label}
                    className={cn(
                      "group flex items-center rounded-2xl py-3 text-sm font-medium transition-all duration-200",
                      isSidebarCollapsed ? "justify-center px-3" : "gap-3 px-4",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[0_20px_40px_-26px_rgba(0,136,130,0.75)]"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-5", !isActive && "group-hover:scale-[1.04]")} />
                    <span className={cn("truncate", isSidebarCollapsed && "sr-only")}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              size={isSidebarCollapsed ? "icon" : "sm"}
              className={cn(
                "rounded-2xl border-dashed bg-background/60 shadow-sm",
                isSidebarCollapsed
                  ? "mx-auto flex size-11"
                  : "h-11 w-full justify-center gap-2 px-4",
              )}
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              aria-label={isSidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
              title={isSidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <>
                  <PanelLeftClose className="size-4" />
                  <span>Свернуть</span>
                </>
              )}
            </Button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/86 backdrop-blur-xl">
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
                      "rounded-full bg-background/80",
                    )}
                  >
                    <UserRound className="size-4" />
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

          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/96 px-3 py-2 backdrop-blur md:hidden">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${mobileNavItems.length}, minmax(0, 1fr))` }}
            >
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeHref === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
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
