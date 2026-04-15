import { LoginForm } from "@/components/auth/login-form";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f4f6f3_0%,#eff6f5_45%,#fbfcfb_100%)] px-4 py-8 dark:bg-[linear-gradient(180deg,#11171a_0%,#10171b_45%,#0c1216_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,118,110,0.22),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(251,191,36,0.18),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(14,116,144,0.12),transparent_26%)]" />
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>

      <div className="relative grid w-full max-w-6xl gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center">
        <div className="hidden rounded-[2rem] border border-white/40 bg-black/90 p-10 text-white shadow-2xl shadow-black/15 md:flex md:min-h-[560px] md:flex-col md:justify-between">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">
              мобильный MVP
            </span>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.02] tracking-tight">
              Посещаемость и дежурства без бумажных таблиц.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-zinc-300">
              Староста, преподаватель и студент работают в одном контуре: отметка
              посещаемости, автоназначение дежурных, бронь, штрафы, бонусы и аналитика.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Быстрая фиксация пары с телефона и крупные зоны нажатия.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Объяснимый автоподбор дежурных с учетом присутствия и баланса.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Красная зона, баллы и история действий для прозрачности решений.
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-5 md:hidden">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
              Студенческий контроль
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              Вход в мобильный кабинет группы
            </h1>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
