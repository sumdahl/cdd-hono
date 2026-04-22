import { boolean, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
  id: varchar("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").notNull().default(false),
});

export type TodoRecord = typeof todos.$inferSelect;
export type NewTodoRecord = typeof todos.$inferInsert;
