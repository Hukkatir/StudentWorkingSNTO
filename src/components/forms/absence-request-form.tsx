"use client";

import { startTransition, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarPlus2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { createAbsenceRequestAction } from "@/actions/attendance";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const absenceFormSchema = z.object({
  type: z.enum(["LESSON", "DAY"]),
  date: z.string().min(1),
  lessonPairId: z.string().optional(),
  reasonId: z.string().min(1),
  comment: z.string().max(240).optional(),
});

type AbsenceRequestFormProps = {
  groupId: string;
  studentId: string;
  reasons: Array<{ id: string; label: string }>;
  lessonOptions: Array<{ id: string; label: string }>;
};

export function AbsenceRequestForm({
  groupId,
  studentId,
  reasons,
  lessonOptions,
}: AbsenceRequestFormProps) {
  const [isPending, setIsPending] = useState(false);
  const form = useForm<z.infer<typeof absenceFormSchema>>({
    resolver: zodResolver(absenceFormSchema),
    defaultValues: {
      type: "DAY",
      date: new Date().toISOString().slice(0, 10),
      lessonPairId: "",
      reasonId: reasons[0]?.id,
      comment: "",
    },
  });

  const requestType = form.watch("type");
  const selectedLessonLabel = lessonOptions.find(
    (lesson) => lesson.id === form.watch("lessonPairId"),
  )?.label;
  const selectedReasonLabel = reasons.find(
    (reason) => reason.id === form.watch("reasonId"),
  )?.label;

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);
    startTransition(async () => {
      try {
        await createAbsenceRequestAction({
          groupId,
          studentId,
          type: values.type,
          date: values.date,
          lessonPairId: values.type === "LESSON" ? values.lessonPairId ?? null : null,
          reasonId: values.reasonId,
          comment: values.comment ?? null,
        });
        toast.success("Заявка на отсутствие отправлена.");
        form.reset({
          ...values,
          comment: "",
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Не удалось отправить заявку.",
        );
      } finally {
        setIsPending(false);
      }
    });
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel>Тип заявки</FieldLabel>
          <ToggleGroup
            value={[requestType]}
            onValueChange={(value) => {
              const nextValue = value[0];
              if (nextValue) {
                form.setValue("type", nextValue as "LESSON" | "DAY");
              }
            }}
            className="grid w-full grid-cols-2 gap-2"
          >
            <ToggleGroupItem value="DAY" className="w-full justify-center">
              На весь день
            </ToggleGroupItem>
            <ToggleGroupItem value="LESSON" className="w-full justify-center">
              На конкретную пару
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="absence-date">Дата</FieldLabel>
          <Input id="absence-date" type="date" {...form.register("date")} />
        </Field>
        {requestType === "LESSON" ? (
          <Field>
            <FieldLabel>Пара</FieldLabel>
            <Select
              value={form.watch("lessonPairId") ?? ""}
              onValueChange={(value) => form.setValue("lessonPairId", value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите пару">
                  {selectedLessonLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {lessonOptions.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        <Field>
          <FieldLabel>Причина</FieldLabel>
          <Select
            value={form.watch("reasonId") ?? ""}
            onValueChange={(value) => form.setValue("reasonId", value ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите причину">
                {selectedReasonLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {reasons.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            На MVP заявка может учитываться системой автоматически.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="absence-comment">Комментарий</FieldLabel>
          <Textarea
            id="absence-comment"
            rows={4}
            placeholder="Если нужно, уточните детали"
            {...form.register("comment")}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <CalendarPlus2 data-icon="inline-start" />
        )}
        Отправить заявку
      </Button>
    </form>
  );
}
