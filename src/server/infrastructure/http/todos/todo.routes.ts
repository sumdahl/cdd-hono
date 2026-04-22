import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { GetAllTodosUseCase } from "../../../core/use-cases/todos/get-all-todos";
import { CreateTodoUseCase } from "../../../core/use-cases/todos/create-todo";
import { getAllTodosResponseSchema, todoSchema } from "./todo.schemas";

export function createTodoRouter(
  getAllTodos: GetAllTodosUseCase,
  createTodo: CreateTodoUseCase,
) {
  const router = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request data",
              details: result.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              })),
            },
          },
          422,
        );
      }
    },
  });

  const getAllTodosRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Todo"],
    description: "Returns a list of all todos",
    responses: {
      200: {
        content: { "application/json": { schema: getAllTodosResponseSchema } },
        description: "List of all todos",
      },
    },
  });

  const createTodoRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Todo"],
    description: "Creates a new todo",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              title: z.string().min(1, "Title is required"),
              description: z.string().min(1, "Description is required"),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": { schema: z.object({ todo: todoSchema }) },
        },
        description: "Created todo",
      },
    },
  });

  router.openapi(getAllTodosRoute, async (c) => {
    const todos = await getAllTodos.execute();
    return c.json({ todos });
  });

  router.openapi(createTodoRoute, async (c) => {
    const input = c.req.valid("json");
    const todo = await createTodo.execute(input);
    return c.json({ todo }, 201);
  });

  return router;
}
