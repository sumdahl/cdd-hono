import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { AppContext } from "../types/context";
import { IRoleRepository } from "../../../core/repositories/role.repository";

export type LoadPermissionsDeps = {
  roleRepository: IRoleRepository;
};

export function createLoadPermissions({
  roleRepository,
}: LoadPermissionsDeps): MiddlewareHandler<AppContext> {
  return createMiddleware(async (c, next) => {
    const roles = c.get("roles") ?? [];

    if (roles.length === 0) {
      c.set("permissions", []);
      await next();
      return;
    }

    const allRoles = await roleRepository.findAll();
    const userRoleIds = allRoles
      .filter((r) => roles.includes(r.name))
      .map((r) => r.id);

    const permissions = await roleRepository.findPermissionsByRoleIds(userRoleIds);
    const permissionNames = [...new Set(permissions.map((p) => p.name))];

    c.set("permissions", permissionNames);

    await next();
  });
}
