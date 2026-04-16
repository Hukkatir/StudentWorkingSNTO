import { ShieldCheck, Sparkles, Users } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { APP_NAME } from "@/lib/branding";

const loginHighlights = [
  {
    title: "Для старосты",
    description: "Быстрая отметка пары, дежурства и контроль статусов без бумажного журнала.",
    icon: ShieldCheck,
  },
  {
    title: "Для преподавателя",
    description: "Оценка дежурств и прозрачная история решений в одном рабочем контуре.",
    icon: Sparkles,
  },
  {
    title: "Для студента",
    description: "Бронь, отсутствие и личная статистика собираются в одном кабинете.",
    icon: Users,
  },
] as const;

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f5f7f4_0%,#eef7f4_42%,#f8faf9_100%)] text-slate-950 dark:bg-[linear-gradient(180deg,#0d1317_0%,#11181d_40%,#0b1115_100%)] dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(13,148,136,0.18),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(59,130,246,0.16),transparent_18%),radial-gradient(circle_at_50%_100%,rgba(15,118,110,0.12),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42vw] border-l border-black/5 bg-white/30 lg:block dark:border-white/6 dark:bg-white/[0.02]" />
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-[1440px] items-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.08fr)_430px] lg:gap-16">
          <section className="flex flex-col justify-center gap-10 py-6 lg:py-12">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-black/8 bg-white/72 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800 shadow-sm shadow-black/5 backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-teal-200 dark:shadow-black/20">
                {APP_NAME}
              </span>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
                Контроль группы без бумажной рутины.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                Посещаемость, дежурства, бронирование и история решений собираются
                в одном рабочем кабинете, понятном для старосты, преподавателя и студента.
              </p>
            </div>

            <div className="grid max-w-2xl gap-4">
              {loginHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 border-l border-teal-600/25 pl-4 dark:border-teal-400/25"
                  >
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-teal-700 shadow-sm shadow-black/5 ring-1 ring-black/5 backdrop-blur dark:bg-white/[0.05] dark:text-teal-200 dark:ring-white/8">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h2>
                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="h-px w-12 bg-slate-300 dark:bg-slate-700" />
              Один вход для всех ролей внутри группы.
            </div>
          </section>

          <aside className="lg:justify-self-end">
            <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-[0_36px_90px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-950/76 dark:shadow-[0_36px_90px_-38px_rgba(0,0,0,0.75)]">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/75 to-transparent" />
              <div className="flex flex-col gap-8">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
                    {APP_NAME}
                  </span>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                    Вход в кабинет
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Введите почту или логин и пароль, чтобы открыть кабинет по вашей роли.
                  </p>
                </div>

                <LoginForm />

                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  После входа система откроет ваш рабочий раздел автоматически.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
