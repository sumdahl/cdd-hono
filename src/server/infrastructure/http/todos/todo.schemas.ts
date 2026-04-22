import { z } from "zod";

export const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  isCompleted: z.boolean().default(false),
});

export const getAllTodosResponseSchema = z.object({
  todos: z.array(todoSchema),
});
