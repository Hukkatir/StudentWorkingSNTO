"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import {
  createAutomaticDutyAssignmentsAction,
  createManualDutyAssignmentsAction,
  previewDutyCandidatesAction,
} from "@/actions/duties";
import { DutyAssignmentDeleteButton } from "@/components/duties/duty-assignment-delete-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatTimeRange } from "@/lib/date";
import { cn } from "@/lib/utils";

type ComplexityCode = "LIGHT" | "MODERATE" | "FULL";

type DutyPlannerProps = {
  groupId: string;
  date: string;
  complexities: Array<{ code: ComplexityCode; label: string }>;
  lessonPairs: Array<{
    id: string;
    pairNumber: number;
    subject: string;
    startTime: string;
    endTime: string;
  }>;
  roster: Array<{ id: string; fullName: string; currentDutyScore: number; totalDuties: number }>;
  initialCandidates: Array<{
    studentId: string;
    fullName: string;
    score: number;
    reasons: string[];
    hasActiveBooking: boolean;
  }>;
  assignments: Array<{
    id: string;
    fullName: string;
    status: "ASSIGNED" | "COMPLETED" | "REFUSED" | "ESCAPED" | "REPLACED" | "CANCELLED";
    complexityLabel: string;
    targetLabel: string;
    hasEvaluation: boolean;
  }>;
  defaultCount?: number;
};

const DAY_SCOPE = "__day__";

export function DutyPlanner({
  groupId,
  date,
  complexities,
  lessonPairs,
  roster,
  initialCandidates,
  assignments,
  defaultCount = 2,
}: DutyPlannerProps) {
  const [isPreviewPending, setIsPreviewPending] = useState(false);
  const [isSubmitPending, setIsSubmitPending] = useState(false);
  const [count, setCount] = useState(String(defaultCount));
  const [complexityCode, setComplexityCode] = useState<ComplexityCode>("MODERATE");
  const [selectedPairId, setSelectedPairId] = useState<string>(DAY_SCOPE);
  const [previewCandidates, setPreviewCandidates] = useState(initialCandidates);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(
    initialCandidates.slice(0, defaultCount).map((candidate) => candidate.studentId),
  );

  const activePair =
    selectedPairId === DAY_SCOPE
      ? null
      : lessonPairs.find((lessonPair) => lessonPair.id === selectedPairId) ?? null;
  const activeTargetLabel = activePair
    ? `Пара ${activePair.pairNumber}: ${activePair.subject}`
    : "Весь учебный день";
  const requiredCount = Number(count);
  const hasEnoughCandidates = previewCandidates.length >= requiredCount;
  const autoAssignDisabled = isSubmitPending || isPreviewPending || !hasEnoughCandidates;

  useEffect(() => {
    let isCancelled = false;

    const loadPreview = async () => {
      setIsPreviewPending(true);

      try {
        const result = await previewDutyCandidatesAction({
          groupId,
          date,
          count: Number(count),
          complexityCode,
          lessonPairId: selectedPairId === DAY_SCOPE ? null : selectedPairId,
        });

        if (isCancelled) {
          return;
        }

        setPreviewCandidates(result.allCandidates);
        setSelectedStudents(
          result.selectedCandidates.map((candidate) => candidate.studentId),
        );
      } catch (error) {
        if (!isCancelled) {
          toast.error(
            error instanceof Error ? error.message : "Не удалось обновить список кандидатов.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsPreviewPending(false);
        }
      }
    };

    void loadPreview();

    return () => {
      isCancelled = true;
    };
  }, [complexityCode, count, date, groupId, selectedPairId]);

  const toggleStudent = (studentId: string, checked: boolean) => {
    setSelectedStudents((current) =>
      checked ? [...new Set([...current, studentId])] : current.filter((id) => id !== studentId),
    );
  };

  const onAutoAssign = async () => {
    setIsSubmitPending(true);

    try {
      await createAutomaticDutyAssignmentsAction({
        groupId,
        date,
        count: Number(count),
        complexityCode,
        lessonPairId: selectedPairId === DAY_SCOPE ? null : selectedPairId,
        notes: null,
      });
      toast.success("Автоподбор применен.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось выполнить автоподбор.");
    } finally {
      setIsSubmitPending(false);
    }
  };

  const onManualAssign = async () => {
    setIsSubmitPending(true);

    try {
      await createManualDutyAssignmentsAction({
        groupId,
        date,
        studentIds: selectedStudents,
        complexityCode,
        lessonPairId: selectedPairId === DAY_SCOPE ? null : selectedPairId,
        mode: "MANUAL",
        notes: null,
      });
      toast.success("Ручное назначение выполнено.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось назначить дежурных вручную.",
      );
    } finally {
      setIsSubmitPending(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
      <div className="flex flex-col gap-4">
        <Card className="border-border/60 shadow-none">
          <CardHeader>
            <CardTitle>Параметры назначения</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Контекст дежурства</span>
              <Select
                value={selectedPairId}
                onValueChange={(value) => setSelectedPairId(value ?? DAY_SCOPE)}
              >
                <SelectTrigger className="h-11 w-full">
                  <span className="truncate">{activeTargetLabel}</span>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value={DAY_SCOPE}>Весь учебный день</SelectItem>
                    {lessonPairs.map((lessonPair) => (
                      <SelectItem key={lessonPair.id} value={lessonPair.id}>
                        Пара {lessonPair.pairNumber} - {lessonPair.subject}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {activePair ? (
                <div className="text-xs text-muted-foreground">
                  {formatTimeRange(activePair.startTime, activePair.endTime)}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Сложность уборки</span>
              <ToggleGroup
                value={[complexityCode]}
                onValueChange={(value) => {
                  const nextValue = value[0];
                  if (nextValue) {
                    setComplexityCode(nextValue as ComplexityCode);
                  }
                }}
                className="grid w-full grid-cols-3 gap-2"
              >
                {complexities.map((complexity) => (
                  <ToggleGroupItem
                    key={complexity.code}
                    value={complexity.code}
                    className="w-full justify-center"
                  >
                    {complexity.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Сколько дежурных нужно</span>
              <ToggleGroup
                value={[count]}
                onValueChange={(value) => {
                  const nextValue = value[0];
                  if (nextValue) {
                    setCount(nextValue);
                  }
                }}
                className="grid w-full grid-cols-4 gap-2"
              >
                {["1", "2", "3", "4"].map((value) => (
                  <ToggleGroupItem key={value} value={value} className="w-full justify-center">
                    {value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="grid gap-2">
              <Button size="lg" onClick={onAutoAssign} disabled={autoAssignDisabled}>
                {isSubmitPending ? (
                  <LoaderCircle className="animate-spin" data-icon="inline-start" />
                ) : (
                  <WandSparkles data-icon="inline-start" />
                )}
                Автоподбор
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onManualAssign}
                disabled={isSubmitPending || isPreviewPending || selectedStudents.length === 0}
              >
                <Sparkles data-icon="inline-start" />
                Назначить вручную
              </Button>
            </div>
            {!isPreviewPending && !hasEnoughCandidates ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
                Для автоподбора нужно отметить посещаемость и иметь минимум {requiredCount}{" "}
                присутствующих студентов в выбранном контексте.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-none">
          <CardHeader>
            <CardTitle>Уже назначенные дежурства</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{assignment.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.targetLabel} - {assignment.complexityLabel}
                      </div>
                    </div>
                    <StatusBadge status={assignment.status} />
                  </div>
                  <div className="flex justify-end">
                    <DutyAssignmentDeleteButton
                      assignmentId={assignment.id}
                      studentName={assignment.fullName}
                      targetLabel={assignment.targetLabel}
                      disabled={assignment.status !== "ASSIGNED" || assignment.hasEvaluation}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                На выбранную дату дежурства еще не назначены.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="border-border/60 shadow-none">
          <CardHeader>
            <CardTitle>Кандидаты автоподбора</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
              {activeTargetLabel}
            </div>
            {isPreviewPending ? (
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
                <LoaderCircle className="animate-spin" />
                Обновляю кандидатов под выбранную пару и настройки.
              </div>
            ) : previewCandidates.length > 0 ? (
              previewCandidates.slice(0, requiredCount).map((candidate, index) => (
                <div
                  key={candidate.studentId}
                  className="rounded-2xl border border-border/70 bg-background/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {index + 1}. {candidate.fullName}
                      </div>
                      <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                        {candidate.reasons.map((reason) => (
                          <li key={reason}>- {reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        candidate.hasActiveBooking
                          ? "bg-teal-500/10 text-teal-700"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {candidate.hasActiveBooking ? "Бронь" : `Рейтинг ${candidate.score}`}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Подходящие кандидаты не найдены. Автоподбор учитывает только студентов,
                отмеченных как присутствующие на день или на выбранную пару.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-none">
          <CardHeader>
            <CardTitle>Ручной выбор студентов</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {roster.map((student) => {
              const checked = selectedStudents.includes(student.id);
              return (
                <label
                  key={student.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 p-4"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => toggleStudent(student.id, value === true)}
                  />
                  <div className="min-w-0">
                    <div className="font-medium">{student.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      Баланс {student.currentDutyScore}, дежурств {student.totalDuties}
                    </div>
                  </div>
                </label>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
