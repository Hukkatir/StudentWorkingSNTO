"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, FileUp, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { previewScheduleImportAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ScheduleImportUploader() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  return (
    <form
      action={(formData) => {
        setIsPending(true);
        startTransition(async () => {
          try {
            const result = await previewScheduleImportAction(formData);
            toast.success(result.message);
            router.push(`/admin/imports/${result.importId}`);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Не удалось подготовить предпросмотр.",
            );
          } finally {
            setIsPending(false);
          }
        });
      }}
      className="flex flex-col gap-3"
    >
      <input
        type="file"
        name="file"
        accept=".json,.csv,.txt,.pdf,application/pdf"
        className="rounded-2xl border border-dashed border-border bg-background px-4 py-5 text-sm"
      />
      <Card className="border-border/60 bg-muted/30 shadow-none">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            Поддерживаются `JSON`, `CSV`, `TXT` и текстовые `PDF`.
            Для PDF лучше использовать файл с текстовым слоем, а не скан-изображение.
          </div>
        </CardContent>
      </Card>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <FileUp data-icon="inline-start" />
        )}
        Загрузить и показать предпросмотр
      </Button>
    </form>
  );
}
