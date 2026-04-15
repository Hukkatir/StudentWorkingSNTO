import { z } from "zod";

export const calculateDutyCandidatesSchema = z.object({
  groupId: z.string().min(1),
  date: z.string().min(1),
  count: z.coerce.number().int().min(1).max(6),
  complexityCode: z.enum(["LIGHT", "MODERATE", "FULL"]),
  lessonPairId: z.string().min(1).nullable().optional(),
});

export const createDutyAssignmentsSchema = z.object({
  groupId: z.string().min(1),
  date: z.string().min(1),
  studentIds: z.array(z.string().min(1)).min(1),
  complexityCode: z.enum(["LIGHT", "MODERATE", "FULL"]),
  lessonPairId: z.string().min(1).nullable().optional(),
  mode: z.enum(["MANUAL", "AUTO", "BOOKED", "REPLACEMENT"]),
  notes: z.string().trim().max(240).nullable().optional(),
});

export const dutyBookingSchema = z.object({
  studentId: z.string().min(1),
  groupId: z.string().min(1),
  date: z.string().min(1),
  preferredComplexityCode: z.enum(["LIGHT", "MODERATE", "FULL"]).nullable().optional(),
  comment: z.string().trim().max(240).nullable().optional(),
});

export const evaluateDutySchema = z.object({
  assignmentId: z.string().min(1),
  quality: z.enum([
    "EXCELLENT",
    "GOOD",
    "SATISFACTORY",
    "UNSATISFACTORY",
    "NOT_DONE",
  ]),
  comment: z.string().trim().max(240).nullable().optional(),
  markedRefusal: z.boolean().optional().default(false),
  markedEscape: z.boolean().optional().default(false),
  replacementStudentId: z.string().nullable().optional(),
});

export const deleteDutyAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
});

export type CalculateDutyCandidatesInput = z.infer<
  typeof calculateDutyCandidatesSchema
>;
export type CreateDutyAssignmentsInput = z.infer<
  typeof createDutyAssignmentsSchema
>;
export type DutyBookingInput = z.infer<typeof dutyBookingSchema>;
export type EvaluateDutyInput = z.infer<typeof evaluateDutySchema>;
export type DeleteDutyAssignmentInput = z.infer<typeof deleteDutyAssignmentSchema>;
