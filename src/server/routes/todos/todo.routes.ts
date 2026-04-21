import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import { getAllTodosResponseModel, Todo, todoModel } from "./models";

const TODOS: Todo[] = [
  {
    id: "1",
    title: "Buy groceries",
    description: "Milk, Bread and Egg",
    isCompleted: false,
  },
];

export const todoRouter = router({
  getAllTodos: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/todos",
        tags: ["Todo"],
        description: "Returns a list of all todos",
      },
    })
    .input(z.undefined())
    .output(getAllTodosResponseModel)
    .query(() => {
      return {
        todos: TODOS,
      };
    }),

  createTodo: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/todos",
        tags: ["Todo"],
        description: "Creates a new todo",
      },
    })
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .output(z.object({ todo: todoModel }))
    .mutation(({ input }) => {
      const newTodo: Todo = {
        id: (TODOS.length + 1).toString(),
        title: input.title,
        description: input.description,
        isCompleted: false,
      };
      TODOS.push(newTodo);
      return { todo: newTodo };
    }),
});
