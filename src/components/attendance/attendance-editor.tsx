"use client";

import { startTransition, useMemo, useState } from "react";
import { LoaderCircle, RotateCcw, Save, Users } from "lucide-react";
import { toast } from "sonner";

import { saveAttendanceAction } from "@/actions/attendance";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDayLabel, formatTimeRange } from "@/lib/date";

type AttendanceEditorProps = {
  lessonPair: {
    id: string;
    pairNumber: number;
    subject: string;
    startTime: string;
    endTime: string;
    lessonDay: { date: Date };
    group: { name: string };
  };
  reasons: Array<{ id: string; label: string }>;
  students: Array<{
    id: string;
    user: { fullName: string };
    attendanceRecord: {
      status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
      reasonId: string | null;
      comment: string | null;
    } | null;
    plannedAbsence: {
      reason: { label: string };
    } | null;
  }>;
};

type RowState = {
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  reasonId: string | null;
  comment: string;
};

export function AttendanceEditor({
  lessonPair,
  reasons,
  students,
}: AttendanceEditorProps) {
  const [isPending, setIsPending] = useState(false);
  const initialRows = useMemo(
    () =>
      Object.fromEntries(
        students.map((student) => [
          student.id,
          {
            status:
              student.attendanceRecord?.status ??
              (student.plannedAbsence ? "EXCUSED" : "PRESENT"),
            reasonId: student.attendanceRecord?.reasonId ?? null,
            comment: student.attendanceRecord?.comment ?? "",
          },
        ]),
      ),
    [students],
  );
  const [rows, setRows] = useState<Record<string, RowState>>(initialRows);
  const reasonLabelMap = useMemo(
    () => new Map(reasons.map((reason) => [reason.id, reason.label])),
    [reasons],
  );

  const updateRow = (studentId: string, patch: Partial<RowState>) => {
    setRows((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        ...patch,
      },
    }));
  };

  const setAllPresent = () => {
    setRows(
      Object.fromEntries(
        students.map((student) => [
          student.id,
          { status: "PRESENT", reasonId: null, comment: "" },
        ]),
      ),
    );
  };

  const resetRows = () => {
    setRows(initialRows);
  };

  const applyPlannedAbsences = () => {
    setRows((current) =>
      Object.fromEntries(
        students.map((student) => [
          student.id,
          student.plannedAbsence
            ? { ...current[student.id], status: "EXCUSED" }
            : current[student.id],
        ]),
      ),
    );
  };

  const onSave = () => {
    setIsPending(true);

    startTransition(async () => {
      try {
        await saveAttendanceAction({
          lessonPairId: lessonPair.id,
          rows: students.map((student) => ({
            studentId: student.id,
            status: rows[student.id].status,
            reasonId: rows[student.id].reasonId,
            comment: rows[student.id].comment || null,
          })),
        });
        toast.success("Посещаемость сохранена.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Не удалось сохранить посещаемость.",
        );
      } finally {
        setIsPending(false);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/60 shadow-none">
        <CardHeader className="gap-3">
          <CardTitle className="text-xl">
            Пара {lessonPair.pairNumber}. {lessonPair.subject}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{lessonPair.group.name}</span>
            <span>•</span>
            <span>{formatDayLabel(lessonPair.lessonDay.date)}</span>
            <span>•</span>
            <span>{formatTimeRange(lessonPair.startTime, lessonPair.endTime)}</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={setAllPresent}>
            <Users data-icon="inline-start" />
            Все присутствуют
          </Button>
          <Button variant="outline" onClick={resetRows}>
            <RotateCcw data-icon="inline-start" />
            Сбросить отметки
          </Button>
          <Button variant="outline" onClick={applyPlannedAbsences}>
            Применить плановые отсутствия
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {students.map((student) => {
          const state = rows[student.id];

          return (
            <Card key={student.id} className="border-border/60 shadow-none">
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{student.user.fullName}</div>
                    {student.plannedAbsence ? (
                      <div className="mt-1">
                        <StatusBadge status="EXCUSED" className="mr-2" />
                        <span className="text-xs text-muted-foreground">
                          Плановое отсутствие: {student.plannedAbsence.reason.label}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <StatusBadge status={state.status} />
                </div>
                <ToggleGroup
                  value={[state.status]}
                  onValueChange={(value) => {
                    const nextValue = value[0];
                    if (nextValue) {
                      updateRow(student.id, {
                        status: nextValue as RowState["status"],
                        reasonId:
                          nextValue === "ABSENT" || nextValue === "EXCUSED"
                            ? state.reasonId
                            : null,
                      });
                    }
                  }}
                  className="grid w-full grid-cols-4 gap-2"
                >
                  <ToggleGroupItem value="PRESENT" className="w-full justify-center">
                    Был
                  </ToggleGroupItem>
                  <ToggleGroupItem value="ABSENT" className="w-full justify-center">
                    Нет
                  </ToggleGroupItem>
                  <ToggleGroupItem value="LATE" className="w-full justify-center">
                    Опоздал
                  </ToggleGroupItem>
                  <ToggleGroupItem value="EXCUSED" className="w-full justify-center">
                    Уваж.
                  </ToggleGroupItem>
                </ToggleGroup>
                {state.status === "ABSENT" || state.status === "EXCUSED" ? (
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Причина</FieldLabel>
                      <Select
                        value={state.reasonId ?? ""}
                        onValueChange={(value) =>
                          updateRow(student.id, { reasonId: value || null })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите причину">
                            {state.reasonId ? reasonLabelMap.get(state.reasonId) : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {reasons.map((reason) => (
                              <SelectItem key={reason.id} value={reason.id}>
                                {reason.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Комментарий</FieldLabel>
                      <Input
                        placeholder="Например, сообщил заранее"
                        value={state.comment}
                        onChange={(event) =>
                          updateRow(student.id, { comment: event.target.value })
                        }
                      />
                    </Field>
                  </FieldGroup>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-16 z-10 rounded-3xl border border-border/70 bg-background/95 p-3 shadow-xl backdrop-blur md:bottom-4">
        <Button size="lg" className="w-full" onClick={onSave} disabled={isPending}>
          {isPending ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          Сохранить посещаемость
        </Button>
      </div>
    </div>
  );
}
