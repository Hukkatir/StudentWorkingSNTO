import { z } from "zod";

export const attendanceRowSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  reasonId: z.string().nullable().optional(),
  comment: z.string().trim().max(240).nullable().optional(),
});

export const saveAttendanceSchema = z.object({
  lessonPairId: z.string().min(1),
  rows: z.array(attendanceRowSchema).min(1),
});

export const absenceRequestSchema = z.object({
  groupId: z.string().min(1),
  studentId: z.string().min(1),
  type: z.enum(["LESSON", "DAY"]),
  date: z.string().min(1),
  lessonPairId: z.string().nullable().optional(),
  reasonId: z.string().min(1),
  comment: z.string().trim().max(240).nullable().optional(),
});

export type SaveAttendanceInput = z.infer<typeof saveAttendanceSchema>;
export type CreateAbsenceRequestInput = z.infer<typeof absenceRequestSchema>;
