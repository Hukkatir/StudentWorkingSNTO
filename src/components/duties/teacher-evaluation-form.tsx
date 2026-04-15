"use client";

import { startTransition, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { evaluateDutyAssignmentAction } from "@/actions/duties";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QUALITY_LABELS } from "@/lib/constants";

const evaluationSchema = z.object({
  quality: z.enum([
    "EXCELLENT",
    "GOOD",
    "SATISFACTORY",
    "UNSATISFACTORY",
    "NOT_DONE",
  ]),
  comment: z.string().max(240).optional(),
  markedRefusal: z.boolean().optional(),
  markedEscape: z.boolean().optional(),
  replacementStudentId: z.string().optional(),
});

const QUALITY_OPTIONS = [
  "EXCELLENT",
  "GOOD",
  "SATISFACTORY",
  "UNSATISFACTORY",
  "NOT_DONE",
] as const;

type TeacherEvaluationFormProps = {
  assignmentId: string;
  replacementCandidates: Array<{ id: string; fullName: string }>;
};

export function TeacherEvaluationForm({
  assignmentId,
  replacementCandidates,
}: TeacherEvaluationFormProps) {
  const [isPending, setIsPending] = useState(false);
  const form = useForm<z.infer<typeof evaluationSchema>>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      quality: "GOOD",
      comment: "",
      markedRefusal: false,
      markedEscape: false,
      replacementStudentId: "",
    },
  });
  const selectedQualityLabel = QUALITY_LABELS[form.watch("quality")];
  const selectedReplacementLabel = replacementCandidates.find(
    (student) => student.id === form.watch("replacementStudentId"),
  )?.fullName;

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);
    startTransition(async () => {
      try {
        await evaluateDutyAssignmentAction({
          assignmentId,
          quality: values.quality,
          comment: values.comment ?? null,
          markedRefusal: values.markedRefusal ?? false,
          markedEscape: values.markedEscape ?? false,
          replacementStudentId: values.replacementStudentId || null,
        });
        toast.success("Оценка дежурства сохранена.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось сохранить оценку.");
      } finally {
        setIsPending(false);
      }
    });
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel>Качество уборки</FieldLabel>
          <Select
            value={form.watch("quality")}
            onValueChange={(value) =>
              form.setValue(
                "quality",
                value as
                  | "EXCELLENT"
                  | "GOOD"
                  | "SATISFACTORY"
                  | "UNSATISFACTORY"
                  | "NOT_DONE",
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите оценку">
                {selectedQualityLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {QUALITY_OPTIONS.map((quality) => (
                  <SelectItem key={quality} value={quality}>
                    {QUALITY_LABELS[quality]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Комментарий</FieldLabel>
          <Textarea rows={4} {...form.register("comment")} />
        </Field>
        <Field className="rounded-2xl border p-4">
          <label className="flex items-center gap-3">
            <Checkbox
              checked={form.watch("markedRefusal")}
              onCheckedChange={(checked) => form.setValue("markedRefusal", checked === true)}
            />
            <span className="text-sm font-medium">Дежурный отказался</span>
          </label>
        </Field>
        <Field className="rounded-2xl border p-4">
          <label className="flex items-center gap-3">
            <Checkbox
              checked={form.watch("markedEscape")}
              onCheckedChange={(checked) => form.setValue("markedEscape", checked === true)}
            />
            <span className="text-sm font-medium">Дежурный сбежал</span>
          </label>
        </Field>
        <Field>
          <FieldLabel>Кто выполнил уборку вместо назначенного</FieldLabel>
          <Select
            value={form.watch("replacementStudentId") ?? ""}
            onValueChange={(value) => form.setValue("replacementStudentId", value ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Замена не потребовалась">
                {selectedReplacementLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {replacementCandidates.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.fullName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <Sparkles data-icon="inline-start" />
        )}
        Сохранить оценку
      </Button>
    </form>
  );
}
