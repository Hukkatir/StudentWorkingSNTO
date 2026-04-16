"use client";

import { startTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { KeyRound, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const loginFormSchema = z.object({
  identifier: z.string().min(2, "Введите почту или логин."),
  password: z.string().min(6, "Минимум 6 символов."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [isPending, setIsPending] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);
    startTransition(async () => {
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
      });

      setIsPending(false);

      if (result?.error) {
        toast.error("Не удалось войти. Проверьте учетные данные.");
        return;
      }

      toast.success("Вход выполнен.");
      router.push(callbackUrl);
      router.refresh();
    });
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(form.formState.errors.identifier)}>
          <FieldLabel htmlFor="identifier" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Почта или логин
          </FieldLabel>
          <Input
            id="identifier"
            autoComplete="username"
            aria-invalid={Boolean(form.formState.errors.identifier)}
            placeholder="Введите почту или логин"
            className="h-11 rounded-xl border-slate-300/80 bg-white/85 px-3 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/[0.04]"
            {...form.register("identifier")}
          />
          <FieldError errors={[form.formState.errors.identifier]} />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.password)}>
          <FieldLabel htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Пароль
          </FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            placeholder="Введите пароль"
            className="h-11 rounded-xl border-slate-300/80 bg-white/85 px-3 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/[0.04]"
            {...form.register("password")}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>
      </FieldGroup>
      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="h-12 w-full rounded-xl text-sm font-semibold shadow-[0_18px_34px_-22px_rgba(15,118,110,0.72)]"
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <KeyRound data-icon="inline-start" />
        )}
        Войти
      </Button>
    </form>
  );
}
