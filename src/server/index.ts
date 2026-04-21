import { router } from "./trpc";
import { todoRouter } from "./routes/todos/todo.routes";

//Root Router
export const appRouter = router({
  todos: todoRouter,
});

export type AppRouter = typeof appRouter;
