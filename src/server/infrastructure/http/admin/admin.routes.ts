import { createRoute, z } from "@hono/zod-openapi";
import { MiddlewareHandler } from "hono";
import { createAppRouter } from "../shared/create-router";
import { requireRole } from "../middleware/auth.middleware";
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
import {
  paginationQuerySchema,
  paginatedResponseSchema,
} from "../shared/pagination";
import { GetAllUsersUseCase } from "../../../core/use-cases/admin/get-all-users";
import { GetUserByIdUseCase } from "../../../core/use-cases/admin/get-user-by-id";
import { DeleteUserUseCase } from "../../../core/use-cases/admin/delete-user";
import { GetAllRolesUseCase } from "../../../core/use-cases/admin/get-all-roles";
import { AssignRoleUseCase } from "../../../core/use-cases/admin/assign-role";
import { RemoveRoleUseCase } from "../../../core/use-cases/admin/remove-role";
import { AppContext } from "../types/context";

export type AdminRouterDeps = {
  getAllUsers: GetAllUsersUseCase;
  getUserById: GetUserByIdUseCase;
  deleteUser: DeleteUserUseCase;
  getAllRoles: GetAllRolesUseCase;
  assignRole: AssignRoleUseCase;
  removeRole: RemoveRoleUseCase;
};

export type AdminRouterMiddleware = {
  authMiddleware: MiddlewareHandler<AppContext>;
};

export function createAdminRouter(
  deps: AdminRouterDeps,
  middleware: AdminRouterMiddleware,
) {
  const router = createAppRouter();
  const { getAllUsers, getUserById, deleteUser, getAllRoles, assignRole, removeRole } = deps;
  const { authMiddleware } = middleware;

  const getAllUsersRoute = createRoute({
    method: "get",
    path: "/users",
    tags: ["Admin"],
    description: "Get all users with pagination — admin only",
    middleware: [authMiddleware, requireRole("admin")],
    request: {
      query: paginationQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(
              paginatedResponseSchema(userResponseSchema),
            ),
          },
        },
        description: "Paginated list of users",
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
    description: "Get all roles with pagination — admin only",
    middleware: [authMiddleware, requireRole("admin")],
    request: {
      query: paginationQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(
              paginatedResponseSchema(roleResponseSchema),
            ),
          },
        },
        description: "Paginated list of roles",
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
      409: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Cannot remove last admin",
      },
    },
  });

  router.openapi(getAllUsersRoute, async (c) => {
    const { page, limit } = c.req.valid("query");
    const result = await getAllUsers.execute({ page, limit });
    return successHandler(c, result);
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
    const { page, limit } = c.req.valid("query");
    const result = await getAllRoles.execute({ page, limit });
    return successHandler(c, result);
  });

  router.openapi(assignRoleRoute, async (c) => {
    const { userId } = c.req.param();
    const { role } = c.req.valid("json");
    await assignRole.execute(userId, role);
    return successHandler(c, {}, "Role assigned successfully");
  });

  router.openapi(removeRoleRoute, async (c) => {
    const { userId, roleName } = c.req.param();
    const requestingUserId = c.get("userId");
    await removeRole.execute(userId, roleName, requestingUserId);
    return successHandler(c, {}, "Role removed successfully");
  });

  return router;
}
