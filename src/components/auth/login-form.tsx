"use client";

import { startTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { KeyRound, LoaderCircle, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const loginFormSchema = z.object({
  identifier: z.string().min(2, "Введите email или логин."),
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
      identifier: "admin@example.com",
      password: "demo12345",
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
    <Card className="border-white/20 bg-white/85 shadow-2xl shadow-black/10 backdrop-blur">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">Вход в систему</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.identifier)}>
              <FieldLabel htmlFor="identifier">Email или логин</FieldLabel>
              <Input
                id="identifier"
                autoComplete="username"
                aria-invalid={Boolean(form.formState.errors.identifier)}
                placeholder="admin@example.com"
                {...form.register("identifier")}
              />
              <FieldDescription>
                Для демо уже подставлен администраторский аккаунт.
              </FieldDescription>
              <FieldError errors={[form.formState.errors.identifier]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FieldLabel htmlFor="password">Пароль</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                placeholder="demo12345"
                {...form.register("password")}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
          </FieldGroup>
          <Button type="submit" size="lg" disabled={isPending} className="w-full">
            {isPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <KeyRound data-icon="inline-start" />}
            Войти
          </Button>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="rounded-xl bg-muted/70 p-3">
              <Mail className="mb-2" />
              `admin@example.com`
            </div>
            <div className="rounded-xl bg-muted/70 p-3">
              <KeyRound className="mb-2" />
              `demo12345`
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
