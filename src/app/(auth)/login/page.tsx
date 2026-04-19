import {
  BookOpen,
  CalendarDays,
  ChartColumnBig,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

const roleCards = [
  {
    title: "Староста",
    description: "Посещаемость, дежурства и быстрые решения по группе.",
    icon: Users,
  },
  {
    title: "Преподаватель",
    description: "Оценка дежурств и история действий без лишних переходов.",
    icon: GraduationCap,
  },
  {
    title: "Студент",
    description: "Расписание, бронь и личный статус в одном кабинете.",
    icon: BookOpen,
  },
] as const;

const workflowCards = [
  {
    title: "Посещаемость",
    note: "По дню и по паре",
    icon: CalendarDays,
  },
  {
    title: "Дежурства",
    note: "Автоподбор и ручной выбор",
    icon: Sparkles,
  },
  {
    title: "Статистика",
    note: "Баланс, инциденты, динамика",
    icon: ChartColumnBig,
  },
] as const;

export default function LoginPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#f7fbfa_0%,#eef6f4_42%,#fbfcfc_100%)] text-slate-950 dark:bg-[linear-gradient(180deg,#0b1212_0%,#0e1717_48%,#091010_100%)] dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(0,136,130,0.18),transparent_24%),radial-gradient(circle_at_74%_12%,rgba(20,56,122,0.10),transparent_18%),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:auto,auto,36px_36px,36px_36px] dark:bg-[radial-gradient(circle_at_14%_18%,rgba(0,136,130,0.24),transparent_24%),radial-gradient(circle_at_74%_12%,rgba(122,167,255,0.10),transparent_18%),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
      <div className="absolute right-4 top-4 z-30">
        <ThemeSwitcher />
      </div>

      <main className="relative mx-auto grid min-h-[100dvh] w-full max-w-[1480px] items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-10 lg:py-10">
        <section className="flex min-w-0 justify-center">
          <div className="flex w-full max-w-5xl flex-col gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary shadow-sm backdrop-blur dark:bg-white/[0.05]">
                <ShieldCheck className="size-4" />
                Управление группой
              </div>

              <div className="mt-6">
                <BrandLogo
                  variant="horizontal"
                  markClassName="size-18 sm:size-20"
                  nameClassName="text-3xl sm:text-4xl"
                  subtitleClassName="text-[11px] sm:text-xs"
                />
              </div>

              <h1 className="mt-7 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Посещаемость, дежурства и статистика в одном месте.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                Рабочее пространство для старосты, преподавателя и студента: от расписания на
                неделю до контроля назначений и личного статуса.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_340px]">
              <div className="rounded-[2.2rem] border border-black/10 bg-white/78 p-5 shadow-[0_32px_80px_-52px_rgba(15,23,42,0.36)] backdrop-blur-xl sm:p-6 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_32px_80px_-52px_rgba(0,0,0,0.78)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                      Рабочий контур
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight">
                      Учебный день без бумажной рутины
                    </div>
                  </div>
                  <div className="rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
                    Спокойный ритм группы
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {workflowCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="rounded-[1.7rem] border border-border/60 bg-background/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">{item.title}</div>
                            <div className="mt-1 text-xs leading-5 text-muted-foreground">
                              {item.note}
                            </div>
                          </div>
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-[1.9rem] border border-border/60 bg-background/80 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {roleCards.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div key={item.title} className="flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-semibold">{item.title}</div>
                            <div className="text-xs leading-5 text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[1.9rem] border border-black/10 bg-white/72 p-5 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.36)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_20px_55px_-42px_rgba(0,0,0,0.72)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                    Что внутри
                  </div>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    <p>Сводка по дню, история действий, управление расписанием и аналитика.</p>
                    <p>Каждая роль видит только свой рабочий контекст и нужные инструменты.</p>
                  </div>
                </div>

                <div className="rounded-[1.9rem] border border-black/10 bg-white/72 p-5 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.36)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_20px_55px_-42px_rgba(0,0,0,0.72)]">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Одна система для всей группы</div>
                      <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Посещаемость, дежурства, бронь и показатели остаются в одном цифровом
                        контуре.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="flex items-center justify-center">
          <div className="relative w-full max-w-[420px]">
            <div className="pointer-events-none absolute inset-6 rounded-[2.4rem] bg-primary/12 blur-3xl dark:bg-primary/18" />
            <div className="relative overflow-hidden rounded-[2.2rem] border border-black/10 bg-white/86 p-6 shadow-[0_50px_100px_-52px_rgba(15,23,42,0.46)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-950/82 dark:shadow-[0_50px_100px_-52px_rgba(0,0,0,0.8)]">
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
              <div className="flex flex-col gap-8">
                <div>
                  <BrandLogo
                    variant="horizontal"
                    subtitle={null}
                    markClassName="size-11"
                    nameClassName="text-xl"
                  />
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight">Вход в кабинет</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Введите почту или логин и пароль. После входа система откроет нужный рабочий
                    раздел автоматически.
                  </p>
                </div>

                <LoginForm />
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
