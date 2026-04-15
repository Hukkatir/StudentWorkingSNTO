"use client";

import { startTransition, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteDutyAssignmentAction } from "@/actions/duties";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DutyAssignmentDeleteButtonProps = {
  assignmentId: string;
  studentName: string;
  targetLabel: string;
  disabled?: boolean;
};

export function DutyAssignmentDeleteButton({
  assignmentId,
  studentName,
  targetLabel,
  disabled = false,
}: DutyAssignmentDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const onDelete = () => {
    setIsPending(true);
    startTransition(async () => {
      try {
        await deleteDutyAssignmentAction({ assignmentId });
        toast.success("Назначение удалено.");
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Не удалось удалить назначение.",
        );
      } finally {
        setIsPending(false);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="destructive" size="sm" disabled={disabled} />}
      >
        <Trash2 data-icon="inline-start" />
        Удалить
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить назначение дежурства?</AlertDialogTitle>
          <AlertDialogDescription>
            Будет удалено назначение для {studentName} в контексте: {targetLabel}. Этот
            сценарий подходит только для ошибочно созданного дежурства.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          <Button variant="destructive" onClick={onDelete} disabled={isPending}>
            {isPending ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Trash2 data-icon="inline-start" />
            )}
            Удалить
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
