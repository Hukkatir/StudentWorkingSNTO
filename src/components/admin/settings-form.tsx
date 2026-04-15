"use client";

import { startTransition, useMemo, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, Save } from "lucide-react";

import { updateSettingsAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type SettingsFormProps = {
  items: Array<{
    key: string;
    label: string;
    description?: string;
    value: boolean | number;
  }>;
};

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
      <FieldGroup>
        {orderedItems.map((item) => (
          <Field key={item.key} className="rounded-2xl border border-border/60 p-4">
            <FieldLabel>{item.label}</FieldLabel>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            {typeof item.value === "boolean" ? (
              <label className="mt-3 flex items-center gap-3">
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
                className="mt-3"
                value={Number(values[item.key])}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [item.key]: Number(event.target.value),
                  }))
                }
              />
            )}
          </Field>
        ))}
      </FieldGroup>
      <Button size="lg" onClick={onSave} disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <Save data-icon="inline-start" />
        )}
        Сохранить правила
      </Button>
    </div>
  );
}
