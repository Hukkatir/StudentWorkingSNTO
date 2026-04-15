"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { previewScheduleImportAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

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
        accept=".json,.csv,.txt"
        className="rounded-2xl border border-dashed border-border bg-background px-4 py-5 text-sm"
      />
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
