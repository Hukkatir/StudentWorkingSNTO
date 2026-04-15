"use client";

import { startTransition, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarCheck2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { createDutyBookingAction } from "@/actions/duties";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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

const bookingSchema = z.object({
  date: z.string().min(1),
  preferredComplexityCode: z.enum(["LIGHT", "MODERATE", "FULL"]).optional(),
  comment: z.string().max(240).optional(),
});

type DutyBookingFormProps = {
  studentId: string;
  groupId: string;
  complexities: Array<{ code: "LIGHT" | "MODERATE" | "FULL"; label: string }>;
};

export function DutyBookingForm({
  studentId,
  groupId,
  complexities,
}: DutyBookingFormProps) {
  const [isPending, setIsPending] = useState(false);
  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      preferredComplexityCode: "MODERATE",
      comment: "",
    },
  });
  const selectedComplexityLabel = complexities.find(
    (complexity) => complexity.code === form.watch("preferredComplexityCode"),
  )?.label;

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);
    startTransition(async () => {
      try {
        await createDutyBookingAction({
          studentId,
          groupId,
          date: values.date,
          preferredComplexityCode: values.preferredComplexityCode ?? null,
          comment: values.comment ?? null,
        });
        toast.success("Бронь на дежурство создана.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось создать бронь.");
      } finally {
        setIsPending(false);
      }
    });
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="booking-date">Дата</FieldLabel>
          <Input id="booking-date" type="date" {...form.register("date")} />
        </Field>
        <Field>
          <FieldLabel>Предпочтительная сложность</FieldLabel>
          <Select
            value={form.watch("preferredComplexityCode")}
            onValueChange={(value) =>
              form.setValue(
                "preferredComplexityCode",
                value as "LIGHT" | "MODERATE" | "FULL",
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите сложность">
                {selectedComplexityLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {complexities.map((complexity) => (
                  <SelectItem key={complexity.code} value={complexity.code}>
                    {complexity.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="booking-comment">Комментарий</FieldLabel>
          <Textarea
            id="booking-comment"
            rows={3}
            placeholder="Например, могу закрыть полную уборку"
            {...form.register("comment")}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <CalendarCheck2 data-icon="inline-start" />
        )}
        Забронировать дежурство
      </Button>
    </form>
  );
}
