import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Введите название группы.").max(40),
  course: z.coerce.number().int().min(1, "Курс должен быть не меньше 1.").max(6),
  year: z.coerce.number().int().min(2020, "Укажите корректный год набора.").max(2100),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(3, "Укажите ФИО студента.").max(120),
  email: z.string().trim().email("Введите корректную почту."),
  login: z
    .string()
    .trim()
    .min(2, "Укажите логин.")
    .max(32)
    .regex(
      /^[a-z0-9._-]+$/i,
      "Логин может содержать только латиницу, цифры, точку, дефис и подчёркивание.",
    ),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов.").max(64),
  groupId: z.string().min(1, "Выберите группу."),
  studentNumber: z.string().trim().max(40).optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
