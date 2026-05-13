import { eq, inArray, and } from "drizzle-orm";
import { DB } from "../db";
import { countAll } from "../db/pagination";
import { withDbError } from "../db/with-db-error";
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
} from "./schema/rbac.schema";
import { IRoleRepository } from "../../core/repositories/role.repository";
import { RoleEntity } from "../../core/entities/role.entity";
import { PermissionEntity } from "../../core/entities/permission.entity";

export class PostgresRoleRepository implements IRoleRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<RoleEntity | null> {
    return withDbError("find role by id", async () => {
      const [row] = await this.db.select().from(roles).where(eq(roles.id, id));
      if (!row) return null;
      return new RoleEntity(row.id, row.name, row.description, row.createdAt);
    });
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return withDbError("find role by name", async () => {
      const [row] = await this.db.select().from(roles).where(eq(roles.name, name));
      if (!row) return null;
      return new RoleEntity(row.id, row.name, row.description, row.createdAt);
    });
  }

  async findAll(
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ roles: RoleEntity[]; total: number }> {
    return withDbError("find all roles", async () => {
      const { limit = 20, offset = 0 } = options;
      const [rows, countResult] = await Promise.all([
        this.db.select().from(roles).limit(limit).offset(offset).orderBy(roles.name),
        this.db.select({ count: countAll }).from(roles),
      ]);
      return {
        roles: rows.map((r) => new RoleEntity(r.id, r.name, r.description, r.createdAt)),
        total: countResult[0].count,
      };
    });
  }

  async findPermissionsByRoleIds(
    roleIds: string[],
  ): Promise<PermissionEntity[]> {
    return withDbError("find permissions by role ids", async () => {
      if (roleIds.length === 0) return [];
      const rows = await this.db
        .select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(inArray(rolePermissions.roleId, roleIds));
      return rows.map(
        ({ permission: p }) => new PermissionEntity(p.id, p.name, p.description, p.createdAt),
      );
    });
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    return withDbError("assign role to user", async () => {
      await this.db.insert(userRoles).values({ userId, roleId }).onConflictDoNothing();
    });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    return withDbError("remove role from user", async () => {
      await this.db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
    });
  }

  async findRolesByUserId(userId: string): Promise<RoleEntity[]> {
    return withDbError("find roles by user id", async () => {
      const rows = await this.db
        .select({ role: roles })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));
      return rows.map(
        ({ role: r }) => new RoleEntity(r.id, r.name, r.description, r.createdAt),
      );
    });
  }

  async findRolesByUserIds(
    userIds: string[],
  ): Promise<Map<string, RoleEntity[]>> {
    return withDbError("find roles by user ids", async () => {
      if (userIds.length === 0) return new Map();
      const rows = await this.db
        .select({ userId: userRoles.userId, role: roles })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(inArray(userRoles.userId, userIds));
      const map = new Map<string, RoleEntity[]>();
      for (const { userId, role: r } of rows) {
        if (!map.has(userId)) map.set(userId, []);
        map.get(userId)!.push(new RoleEntity(r.id, r.name, r.description, r.createdAt));
      }
      return map;
    });
  }

  async countUsersWithRole(roleId: string): Promise<number> {
    return withDbError("count users with role", async () => {
      const result = await this.db
        .select({ count: countAll })
        .from(userRoles)
        .where(eq(userRoles.roleId, roleId));
      return result[0]?.count ?? 0;
    });
  }
}
