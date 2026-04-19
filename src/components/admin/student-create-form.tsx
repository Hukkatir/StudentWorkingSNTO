"use client";

import { startTransition, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoaderCircle, UserPlus2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createStudentAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStudentSchema, type CreateStudentInput } from "@/modules/admin/schemas";

type StudentCreateFormProps = {
  groups: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
};

export function StudentCreateForm({ groups, onSuccess }: StudentCreateFormProps) {
  const [isPending, setIsPending] = useState(false);
  const defaultGroupId = groups[0]?.id ?? "";

  const form = useForm<z.input<typeof createStudentSchema>, undefined, CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      login: "",
      password: "",
      groupId: defaultGroupId,
      studentNumber: "",
      active: true,
    },
  });

  const selectedGroupName = useMemo(
    () => groups.find((group) => group.id === form.watch("groupId"))?.name,
    [groups, form],
  );

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);
    startTransition(async () => {
      try {
        await createStudentAction(values);
        toast.success("Студент и учетная запись созданы.");
        form.reset({
          fullName: "",
          email: "",
          login: "",
          password: "",
          groupId: defaultGroupId,
          studentNumber: "",
          active: true,
        });
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось создать студента.");
      } finally {
        setIsPending(false);
      }
    });
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(form.formState.errors.fullName)}>
          <FieldLabel htmlFor="student-full-name">ФИО студента</FieldLabel>
          <Input
            id="student-full-name"
            placeholder="Иванов Иван Иванович"
            className="h-11 rounded-2xl"
            {...form.register("fullName")}
          />
          <FieldError errors={[form.formState.errors.fullName]} />
        </Field>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field data-invalid={Boolean(form.formState.errors.email)}>
            <FieldLabel htmlFor="student-email">Почта</FieldLabel>
            <Input
              id="student-email"
              type="email"
              placeholder="student@example.com"
              className="h-11 rounded-2xl"
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.login)}>
            <FieldLabel htmlFor="student-login">Логин</FieldLabel>
            <Input
              id="student-login"
              placeholder="ivanov_i"
              className="h-11 rounded-2xl"
              {...form.register("login")}
            />
            <FieldError errors={[form.formState.errors.login]} />
          </Field>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
          <Field data-invalid={Boolean(form.formState.errors.password)}>
            <FieldLabel htmlFor="student-password">Пароль</FieldLabel>
            <Input
              id="student-password"
              type="password"
              placeholder="Не меньше 6 символов"
              className="h-11 rounded-2xl"
              {...form.register("password")}
            />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.studentNumber)}>
            <FieldLabel htmlFor="student-number">Номер</FieldLabel>
            <Input
              id="student-number"
              placeholder="Студ. билет"
              className="h-11 rounded-2xl"
              {...form.register("studentNumber")}
            />
            <FieldError errors={[form.formState.errors.studentNumber]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(form.formState.errors.groupId)}>
          <FieldLabel>Группа</FieldLabel>
          <Select
            value={form.watch("groupId")}
            onValueChange={(value) => form.setValue("groupId", value ?? "")}
          >
            <SelectTrigger className="h-11 w-full rounded-2xl">
              <SelectValue placeholder="Выберите группу">{selectedGroupName}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldError errors={[form.formState.errors.groupId]} />
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

      <Button
        type="submit"
        size="lg"
        disabled={isPending || groups.length === 0}
        className="h-12 rounded-2xl"
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <UserPlus2 data-icon="inline-start" />
        )}
        Добавить студента
      </Button>
    </form>
  );
}
