"use client";

import { startTransition, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FolderPlus, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createGroupAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createGroupSchema, type CreateGroupInput } from "@/modules/admin/schemas";

type GroupCreateFormProps = {
  onSuccess?: () => void;
};

export function GroupCreateForm({ onSuccess }: GroupCreateFormProps) {
  const [isPending, setIsPending] = useState(false);
  const form = useForm<z.input<typeof createGroupSchema>, undefined, CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      course: 2,
      year: new Date().getFullYear(),
      department: "",
      active: true,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);
    startTransition(async () => {
      try {
        await createGroupAction(values);
        toast.success("Группа добавлена.");
        form.reset({
          name: "",
          course: values.course,
          year: values.year,
          department: "",
          active: true,
        });
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось создать группу.");
      } finally {
        setIsPending(false);
      }
    });
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(form.formState.errors.name)}>
          <FieldLabel htmlFor="group-name">Название группы</FieldLabel>
          <Input
            id="group-name"
            placeholder="Например, ИС-23"
            className="h-11 rounded-2xl"
            {...form.register("name")}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(form.formState.errors.course)}>
            <FieldLabel htmlFor="group-course">Курс</FieldLabel>
            <Input
              id="group-course"
              type="number"
              min={1}
              max={6}
              className="h-11 rounded-2xl"
              {...form.register("course", { valueAsNumber: true })}
            />
            <FieldError errors={[form.formState.errors.course]} />
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.year)}>
            <FieldLabel htmlFor="group-year">Год набора</FieldLabel>
            <Input
              id="group-year"
              type="number"
              min={2020}
              max={2100}
              className="h-11 rounded-2xl"
              {...form.register("year", { valueAsNumber: true })}
            />
            <FieldError errors={[form.formState.errors.year]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(form.formState.errors.department)}>
          <FieldLabel htmlFor="group-department">Отделение</FieldLabel>
          <Input
            id="group-department"
            placeholder="Например, Программирование"
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
            <FieldLabel>Группа активна</FieldLabel>
          </div>
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={isPending} className="h-12 rounded-2xl">
        {isPending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <FolderPlus data-icon="inline-start" />
        )}
        Добавить группу
      </Button>
    </form>
  );
}
