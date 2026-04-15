import type {
  AbsenceRequestStatus,
  AttendanceStatus,
  CleaningQuality,
  DutyBookingStatus,
  DutyAssignmentStatus,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  ABSENCE_STATUS_LABELS,
  ATTENDANCE_STATUS_OPTIONS,
  BOOKING_STATUS_LABELS,
  DUTY_STATUS_LABELS,
  QUALITY_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status:
    | AttendanceStatus
    | DutyAssignmentStatus
    | DutyBookingStatus
    | CleaningQuality
    | AbsenceRequestStatus;
  className?: string;
};

const toneMap: Record<string, string> = {
  PRESENT: "bg-emerald-500/10 text-emerald-700",
  ABSENT: "bg-rose-500/10 text-rose-700",
  LATE: "bg-amber-500/10 text-amber-700",
  EXCUSED: "bg-sky-500/10 text-sky-700",
  ASSIGNED: "bg-blue-500/10 text-blue-700",
  COMPLETED: "bg-emerald-500/10 text-emerald-700",
  REFUSED: "bg-rose-500/10 text-rose-700",
  ESCAPED: "bg-red-500/10 text-red-700",
  REPLACED: "bg-violet-500/10 text-violet-700",
  CANCELLED: "bg-zinc-500/10 text-zinc-700",
  EXCELLENT: "bg-emerald-500/10 text-emerald-700",
  GOOD: "bg-teal-500/10 text-teal-700",
  SATISFACTORY: "bg-amber-500/10 text-amber-700",
  UNSATISFACTORY: "bg-orange-500/10 text-orange-700",
  NOT_DONE: "bg-red-500/10 text-red-700",
  PENDING: "bg-amber-500/10 text-amber-700",
  APPROVED: "bg-emerald-500/10 text-emerald-700",
  REJECTED: "bg-rose-500/10 text-rose-700",
  AUTO_REGISTERED: "bg-blue-500/10 text-blue-700",
  ACTIVE: "bg-teal-500/10 text-teal-700",
  USED: "bg-emerald-500/10 text-emerald-700",
  EXPIRED: "bg-zinc-500/10 text-zinc-700",
};

function getLabel(status: StatusBadgeProps["status"]) {
  if (status in DUTY_STATUS_LABELS) {
    return DUTY_STATUS_LABELS[status as DutyAssignmentStatus];
  }

  if (status in BOOKING_STATUS_LABELS) {
    return BOOKING_STATUS_LABELS[status as DutyBookingStatus];
  }

  if (status in QUALITY_LABELS) {
    return QUALITY_LABELS[status as CleaningQuality];
  }

  if (status in ABSENCE_STATUS_LABELS) {
    return ABSENCE_STATUS_LABELS[status as AbsenceRequestStatus];
  }

  return (
    ATTENDANCE_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
  );
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-transparent text-xs font-medium",
        toneMap[status],
        className,
      )}
    >
      {getLabel(status)}
    </Badge>
  );
}
