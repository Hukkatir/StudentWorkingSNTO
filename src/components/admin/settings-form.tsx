"use client";

import { startTransition, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckSquare,
  LoaderCircle,
  Save,
  ShieldAlert,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { toast } from "sonner";

import { updateSettingsAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SettingsFormProps = {
  items: Array<{
    key: string;
    label: string;
    description?: string;
    value: boolean | number;
  }>;
};

const iconMap = {
  "duty.lookbackDays": CalendarClock,
  "redZone.incidentThreshold": ShieldAlert,
  "duty.maxConsecutiveBookingDays": TimerReset,
  "absence.autoApproval": CheckSquare,
  "points.qualityPenaltyValue": ShieldAlert,
  "points.qualityBonusValue": Sparkles,
} as const;

export function SettingsForm({ items }: SettingsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [values, setValues] = useState<Record<string, boolean | number>>(
    Object.fromEntries(items.map((item) => [item.key, item.value])),
  );

  const orderedItems = useMemo(() => items, [items]);

  const onSave = () => {
    setIsPending(true);
    startTransition(async () => {
      try {
        await updateSettingsAction(values);
        toast.success("Настройки сохранены.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось сохранить настройки.");
      } finally {
        setIsPending(false);
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <FieldGroup className="grid gap-3 lg:grid-cols-2">
        {orderedItems.map((item) => {
          const Icon = iconMap[item.key as keyof typeof iconMap] ?? Sparkles;

          return (
            <Field
              key={item.key}
              className="rounded-[1.6rem] border border-border/60 bg-[linear-gradient(180deg,rgba(0,136,130,0.05),transparent_72%)] p-4 shadow-none"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-background/80 text-primary shadow-sm">
                  <Icon className="size-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="space-y-1">
                    <FieldLabel className="text-sm">{item.label}</FieldLabel>
                    {item.description ? (
                      <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>

                  {typeof item.value === "boolean" ? (
                    <label className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-3">
                      <Checkbox
                        checked={Boolean(values[item.key])}
                        onCheckedChange={(checked) =>
                          setValues((current) => ({
                            ...current,
                            [item.key]: checked === true,
                          }))
                        }
                      />
                      <span className="text-sm font-medium">Включено</span>
                    </label>
                  ) : (
                    <Input
                      type="number"
                      className={cn("h-11 rounded-2xl bg-background/80")}
                      value={Number(values[item.key])}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [item.key]: Number(event.target.value),
                        }))
                      }
                    />
                  )}
                </div>
              </div>
            </Field>
          );
        })}
      </FieldGroup>
      <div className="flex justify-end">
        <Button size="lg" onClick={onSave} disabled={isPending} className="rounded-2xl px-5">
          {isPending ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          Сохранить правила
        </Button>
      </div>
    </div>
  );
}
