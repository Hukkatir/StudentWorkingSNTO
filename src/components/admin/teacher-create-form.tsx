"use client";

import { startTransition, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { GraduationCap, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createTeacherAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createTeacherSchema, type CreateTeacherInput } from "@/modules/admin/schemas";

type TeacherCreateFormProps = {
  onSuccess?: () => void;
};

export function TeacherCreateForm({ onSuccess }: TeacherCreateFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.input<typeof createTeacherSchema>, undefined, CreateTeacherInput>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      fullName: "",
      email: "",
      login: "",
      password: "",
      department: "",
      title: "",
      active: true,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);
    startTransition(async () => {
      try {
        await createTeacherAction(values);
        toast.success("Преподаватель и учетная запись созданы.");
        form.reset({
          fullName: "",
          email: "",
          login: "",
          password: "",
          department: "",
          title: "",
          active: true,
        });
        onSuccess?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Не удалось создать преподавателя.",
        );
      } finally {
        setIsPending(false);
      }
    });
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(form.formState.errors.fullName)}>
          <FieldLabel htmlFor="teacher-full-name">ФИО преподавателя</FieldLabel>
          <Input
            id="teacher-full-name"
            placeholder="Петрова Ирина Сергеевна"
            className="h-11 rounded-2xl"
            {...form.register("fullName")}
          />
          <FieldError errors={[form.formState.errors.fullName]} />
        </Field>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field data-invalid={Boolean(form.formState.errors.email)}>
            <FieldLabel htmlFor="teacher-email">Почта</FieldLabel>
            <Input
              id="teacher-email"
              type="email"
              placeholder="teacher@example.com"
              className="h-11 rounded-2xl"
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.login)}>
            <FieldLabel htmlFor="teacher-login">Логин</FieldLabel>
            <Input
              id="teacher-login"
              placeholder="petrova_i"
              className="h-11 rounded-2xl"
              {...form.register("login")}
            />
            <FieldError errors={[form.formState.errors.login]} />
          </Field>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Field data-invalid={Boolean(form.formState.errors.password)}>
            <FieldLabel htmlFor="teacher-password">Пароль</FieldLabel>
            <Input
              id="teacher-password"
              type="password"
              placeholder="Не меньше 6 символов"
              className="h-11 rounded-2xl"
              {...form.register("password")}
            />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.title)}>
            <FieldLabel htmlFor="teacher-title">Должность</FieldLabel>
            <Input
              id="teacher-title"
              placeholder="Преподаватель, доцент"
              className="h-11 rounded-2xl"
              {...form.register("title")}
            />
            <FieldError errors={[form.formState.errors.title]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(form.formState.errors.department)}>
          <FieldLabel htmlFor="teacher-department">Кафедра или направление</FieldLabel>
          <Input
            id="teacher-department"
            placeholder="Информационные технологии"
            className="h-11 rounded-2xl"
            {...form.register("department")}
          />
          <FieldError errors={[form.formState.errors.department]} />
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            checked={Boolean(form.watch("active"))}
            onCheckedChange={(checked) => form.setValue("active", checked === true)}
          />
          <div className="space-y-1">
            <FieldLabel>Активная учетная запись</FieldLabel>
          </div>
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={isPending} className="h-12 rounded-2xl">
        {isPending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <GraduationCap data-icon="inline-start" />
        )}
        Добавить преподавателя
      </Button>
    </form>
  );
}
