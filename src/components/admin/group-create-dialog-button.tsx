"use client";

import { useState } from "react";
import { FolderPlus, Plus } from "lucide-react";

import { GroupCreateForm } from "@/components/admin/group-create-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function GroupCreateDialogButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="lg" className="rounded-2xl px-4 shadow-sm" />}
      >
        <Plus data-icon="inline-start" />
        Добавить группу
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[2rem] p-0">
        <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(0,136,130,0.10),transparent_90%)] px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FolderPlus className="size-5" />
              </span>
              Новая группа
            </DialogTitle>
            <DialogDescription>
              Заполните основные поля, и группа сразу появится в каталоге и рабочих разделах.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-6">
          <GroupCreateForm onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
