import { createRoute, z } from "@hono/zod-openapi";
import { createAppRouter } from "../shared/create-router";
import { authMiddleware, requireRole } from "../middleware/auth.middleware";
import {
  successResponseSchema,
  errorResponseSchema,
} from "../response/response.schemas";
import { successHandler } from "../response/response.handler";
import {
  userResponseSchema,
  assignRoleSchema,
  roleResponseSchema,
} from "./admin.schemas";
import { GetAllUsersUseCase } from "../../../core/use-cases/admin/get-all-users";
import { GetUserByIdUseCase } from "../../../core/use-cases/admin/get-user-by-id";
import { DeleteUserUseCase } from "../../../core/use-cases/admin/delete-user";
import { GetAllRolesUseCase } from "../../../core/use-cases/admin/get-all-roles";
import { AssignRoleUseCase } from "../../../core/use-cases/admin/assign-role";
import { RemoveRoleUseCase } from "../../../core/use-cases/admin/remove-role";

export function createAdminRouter(
  getAllUsers: GetAllUsersUseCase,
  getUserById: GetUserByIdUseCase,
  deleteUser: DeleteUserUseCase,
  getAllRoles: GetAllRolesUseCase,
  assignRole: AssignRoleUseCase,
  removeRole: RemoveRoleUseCase,
) {
  const router = createAppRouter();

  const getAllUsersRoute = createRoute({
    method: "get",
    path: "/users",
    tags: ["Admin"],
    description: "Get all users — admin only",
    middleware: [authMiddleware, requireRole("admin")],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(
              z.object({ users: z.array(userResponseSchema) }),
            ),
          },
        },
        description: "List of all users",
      },
      401: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Unauthorized",
      },
      403: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Forbidden",
      },
    },
  });

  const getUserByIdRoute = createRoute({
    method: "get",
    path: "/users/:userId",
    tags: ["Admin"],
    description: "Get user by ID — admin only",
    middleware: [authMiddleware, requireRole("admin")],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(
              z.object({ user: userResponseSchema }),
            ),
          },
        },
        description: "User details",
      },
      401: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Unauthorized",
      },
      403: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Forbidden",
      },
      404: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "User not found",
      },
    },
  });

  const deleteUserRoute = createRoute({
    method: "delete",
    path: "/users/:userId",
    tags: ["Admin"],
    description: "Delete user — admin only",
    middleware: [authMiddleware, requireRole("admin")],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(z.object({})),
          },
        },
        description: "User deleted",
      },
      401: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Unauthorized",
      },
      403: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Forbidden",
      },
      404: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "User not found",
      },
    },
  });

  const getAllRolesRoute = createRoute({
    method: "get",
    path: "/roles",
    tags: ["Admin"],
    description: "Get all roles — admin only",
    middleware: [authMiddleware, requireRole("admin")],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(
              z.object({ roles: z.array(roleResponseSchema) }),
            ),
          },
        },
        description: "List of all roles",
      },
      401: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Unauthorized",
      },
      403: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Forbidden",
      },
    },
  });

  const assignRoleRoute = createRoute({
    method: "post",
    path: "/users/:userId/roles",
    tags: ["Admin"],
    description: "Assign role to user — admin only",
    middleware: [authMiddleware, requireRole("admin")],
    request: {
      body: { content: { "application/json": { schema: assignRoleSchema } } },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(z.object({})),
          },
        },
        description: "Role assigned successfully",
      },
      401: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Unauthorized",
      },
      403: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Forbidden",
      },
      404: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "User or role not found",
      },
    },
  });

  const removeRoleRoute = createRoute({
    method: "delete",
    path: "/users/:userId/roles/:roleName",
    tags: ["Admin"],
    description: "Remove role from user — admin only",
    middleware: [authMiddleware, requireRole("admin")],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(z.object({})),
          },
        },
        description: "Role removed successfully",
      },
      401: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Unauthorized",
      },
      403: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Forbidden",
      },
      404: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "User or role not found",
      },
    },
  });

  router.openapi(getAllUsersRoute, async (c) => {
    const users = await getAllUsers.execute();
    return successHandler(c, { users });
  });

  router.openapi(getUserByIdRoute, async (c) => {
    const { userId } = c.req.param();
    const user = await getUserById.execute(userId);
    return successHandler(c, { user });
  });

  router.openapi(deleteUserRoute, async (c) => {
    const { userId } = c.req.param();
    const requestingUserId = c.get("userId");
    await deleteUser.execute(userId, requestingUserId);
    return successHandler(c, {}, "User deleted successfully");
  });

  router.openapi(getAllRolesRoute, async (c) => {
    const roles = await getAllRoles.execute();
    return successHandler(c, { roles });
  });

  router.openapi(assignRoleRoute, async (c) => {
    const { userId } = c.req.param();
    const { role } = c.req.valid("json");
    await assignRole.execute(userId, role);
    return successHandler(c, {}, "Role assigned successfully");
  });

  router.openapi(removeRoleRoute, async (c) => {
    const { userId, roleName } = c.req.param();
    await removeRole.execute(userId, roleName);
    return successHandler(c, {}, "Role removed successfully");
  });

  return router;
}
