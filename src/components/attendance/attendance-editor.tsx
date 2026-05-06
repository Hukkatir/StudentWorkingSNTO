"use client";

import { startTransition, useMemo, useState } from "react";
import { CheckCheck, Copy, LoaderCircle, RotateCcw, Save, Users, UserX } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
  const [copiedKey, setCopiedKey] = useState<"present" | "absent" | "summary" | null>(null);
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
  const attendanceDigest = useMemo(() => {
    const presentRows: string[] = [];
    const absentRows: string[] = [];
    const lateRows: string[] = [];
    const excusedRows: string[] = [];

    students.forEach((student) => {
      const row = rows[student.id];
      const fullName = student.user.fullName;
      const reasonLabel = row.reasonId ? reasonLabelMap.get(row.reasonId) : null;
      const commentSuffix = row.comment ? ` - ${row.comment}` : "";

      if (row.status === "PRESENT") {
        presentRows.push(fullName);
        return;
      }

      if (row.status === "LATE") {
        presentRows.push(`${fullName} (опоздал)`);
        lateRows.push(fullName);
        return;
      }

      if (row.status === "ABSENT") {
        absentRows.push(
          `${fullName}${reasonLabel ? ` (${reasonLabel.toLowerCase()})` : ""}${commentSuffix}`,
        );
        return;
      }

      if (row.status === "EXCUSED") {
        absentRows.push(
          `${fullName}${reasonLabel ? ` (${reasonLabel.toLowerCase()})` : " (уважительная причина)"}${commentSuffix}`,
        );
        excusedRows.push(fullName);
      }
    });

    const summaryLines = [
      `Пара ${lessonPair.pairNumber}. ${lessonPair.subject}`,
      `${lessonPair.group.name}, ${formatDayLabel(lessonPair.lessonDay.date)}`,
      formatTimeRange(lessonPair.startTime, lessonPair.endTime),
      "",
      `Были (${presentRows.length}):`,
      presentRows.length ? presentRows.join("\n") : "Нет отмеченных присутствующих.",
      "",
      `Не были (${absentRows.length}):`,
      absentRows.length ? absentRows.join("\n") : "Нет отсутствующих.",
      "",
      `Опоздали: ${lateRows.length || 0}`,
      `Уважительные: ${excusedRows.length || 0}`,
    ];

    return {
      presentText: presentRows.length ? presentRows.join("\n") : "Нет отмеченных присутствующих.",
      absentText: absentRows.length ? absentRows.join("\n") : "Нет отсутствующих.",
      summaryText: summaryLines.join("\n"),
      presentCount: presentRows.length,
      absentCount: absentRows.length,
      lateCount: lateRows.length,
      excusedCount: excusedRows.length,
    };
  }, [lessonPair, reasonLabelMap, rows, students]);

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

  const copyDigest = async (
    key: "present" | "absent" | "summary",
    value: string,
    successMessage: string,
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast.success(successMessage);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1600);
    } catch {
      toast.error("Не удалось скопировать текст.");
    }
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
        <CardContent className="grid gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" className="w-full sm:w-auto" onClick={setAllPresent}>
            <Users data-icon="inline-start" />
            Все присутствуют
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={resetRows}>
            <RotateCcw data-icon="inline-start" />
            Сбросить отметки
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={applyPlannedAbsences}
          >
            Применить плановые отсутствия
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-[linear-gradient(145deg,rgba(0,136,130,0.1),rgba(20,56,122,0.06))] shadow-none">
        <CardHeader className="border-b border-border/60">
          <CardTitle>Списки для копирования</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="rounded-2xl border border-border/60 bg-background/85 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Были
                </div>
                <div className="mt-2 text-2xl font-semibold">{attendanceDigest.presentCount}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/85 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Не были
                </div>
                <div className="mt-2 text-2xl font-semibold">{attendanceDigest.absentCount}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/85 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Опоздали
                </div>
                <div className="mt-2 text-2xl font-semibold">{attendanceDigest.lateCount}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/85 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Уважит.
                </div>
                <div className="mt-2 text-2xl font-semibold">{attendanceDigest.excusedCount}</div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/88 p-3">
                <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCheck className="size-4 text-emerald-600 dark:text-emerald-300" />
                    Список присутствующих
                  </div>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label="Скопировать список присутствующих"
                    title="Скопировать список присутствующих"
                    onClick={() =>
                      copyDigest(
                        "present",
                        attendanceDigest.presentText,
                        "Список присутствующих скопирован.",
                      )
                    }
                  >
                    {copiedKey === "present" ? <CheckCheck /> : <Copy />}
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={attendanceDigest.presentText}
                  className="min-h-36 resize-none rounded-2xl bg-background/70 text-sm sm:min-h-44"
                />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/88 p-3">
                <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    <UserX className="size-4 text-rose-600 dark:text-rose-300" />
                    Список отсутствующих
                  </div>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label="Скопировать список отсутствующих"
                    title="Скопировать список отсутствующих"
                    onClick={() =>
                      copyDigest(
                        "absent",
                        attendanceDigest.absentText,
                        "Список отсутствующих скопирован.",
                      )
                    }
                  >
                    {copiedKey === "absent" ? <CheckCheck /> : <Copy />}
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={attendanceDigest.absentText}
                  className="min-h-36 resize-none rounded-2xl bg-background/70 text-sm sm:min-h-44"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/88 p-3">
            <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium">Готовый сводный текст</div>
              <Button
                variant="outline"
                size="icon-sm"
                className="shrink-0"
                aria-label="Скопировать сводный текст"
                title="Скопировать сводный текст"
                onClick={() =>
                  copyDigest("summary", attendanceDigest.summaryText, "Сводка скопирована.")
                }
              >
                {copiedKey === "summary" ? <CheckCheck /> : <Copy />}
              </Button>
            </div>
            <Textarea
              readOnly
              value={attendanceDigest.summaryText}
              className="min-h-[18rem] resize-none rounded-2xl bg-background/70 text-sm sm:min-h-[24rem]"
            />
          </div>
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
                  className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
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
