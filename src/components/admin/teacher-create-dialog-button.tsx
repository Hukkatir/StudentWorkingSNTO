"use client";

import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";

import { TeacherCreateForm } from "@/components/admin/teacher-create-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TeacherCreateDialogButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="rounded-2xl px-4 shadow-sm" />}>
        <Plus data-icon="inline-start" />
        Добавить преподавателя
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-[2rem] p-0">
        <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(20,56,122,0.08),rgba(0,136,130,0.08)_88%,transparent)] px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <GraduationCap className="size-5" />
              </span>
              Новый преподаватель
            </DialogTitle>
            <DialogDescription>
              Создайте учетную запись преподавателя, чтобы привязывать пары из расписания и
              открывать доступ к оценке дежурств.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-6">
          <TeacherCreateForm onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
