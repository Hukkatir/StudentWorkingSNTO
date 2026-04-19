"use client";

import { useState } from "react";
import { Plus, UserPlus2 } from "lucide-react";

import { StudentCreateForm } from "@/components/admin/student-create-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type StudentCreateDialogButtonProps = {
  groups: Array<{ id: string; name: string }>;
};

export function StudentCreateDialogButton({
  groups,
}: StudentCreateDialogButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="lg" className="rounded-2xl px-4 shadow-sm" />}
      >
        <Plus data-icon="inline-start" />
        Добавить студента
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-[2rem] p-0">
        <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(20,56,122,0.08),rgba(0,136,130,0.08)_88%,transparent)] px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserPlus2 className="size-5" />
              </span>
              Новый студент
            </DialogTitle>
            <DialogDescription>
              Создайте учетную запись и сразу привяжите студента к нужной группе.
              {groups.length === 0 ? " Сначала добавьте хотя бы одну группу." : ""}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-6">
          <StudentCreateForm groups={groups} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
