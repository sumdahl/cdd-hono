import { IRoleRepository } from "../../src/server/core/repositories/role.repository";
import { RoleEntity } from "../../src/server/core/entities/role.entity";
import { PermissionEntity } from "../../src/server/core/entities/permission.entity";

export class InMemoryRoleRepository implements IRoleRepository {
  private roles: RoleEntity[] = [
    new RoleEntity(
      crypto.randomUUID(),
      "user",
      "Basic user access",
      new Date(),
    ),
    new RoleEntity(crypto.randomUUID(), "admin", "Full access", new Date()),
    new RoleEntity(
      crypto.randomUUID(),
      "moderator",
      "Moderator access",
      new Date(),
    ),
  ];

  private userRoles: { userId: string; roleId: string }[] = [];

  async findById(id: string): Promise<RoleEntity | null> {
    return this.roles.find((r) => r.id === id) ?? null;
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return this.roles.find((r) => r.name === name) ?? null;
  }

  async findAll(
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ roles: RoleEntity[]; total: number }> {
    const { limit = 20, offset = 0 } = options;
    const total = this.roles.length;
    const roles = this.roles.slice(offset, offset + limit);
    return { roles, total };
  }

  async findPermissionsByRoleIds(
    roleIds: string[],
  ): Promise<PermissionEntity[]> {
    const matchedRoles = this.roles.filter((r) => roleIds.includes(r.id));
    if (matchedRoles.some((r) => r.name === "admin")) {
      return [new PermissionEntity(crypto.randomUUID(), "manage_users", "Can manage users", new Date())];
    }
    return [new PermissionEntity(crypto.randomUUID(), "read_content", "Can read content", new Date())];
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const exists = this.userRoles.find(
      (ur) => ur.userId === userId && ur.roleId === roleId,
    );
    if (!exists) {
      this.userRoles.push({ userId, roleId });
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    this.userRoles = this.userRoles.filter(
      (ur) => !(ur.userId === userId && ur.roleId === roleId),
    );
  }
  async findRolesByUserId(userId: string): Promise<RoleEntity[]> {
    const roleIds = this.userRoles
      .filter((ur) => ur.userId === userId)
      .map((ur) => ur.roleId);
    return this.roles.filter((r) => roleIds.includes(r.id));
  }

  async findRolesByUserIds(
    userIds: string[],
  ): Promise<Map<string, RoleEntity[]>> {
    const map = new Map<string, RoleEntity[]>();
    for (const userId of userIds) {
      const roleIds = this.userRoles
        .filter((ur) => ur.userId === userId)
        .map((ur) => ur.roleId);
      const userRoleEntities = this.roles.filter((r) => roleIds.includes(r.id));
      map.set(userId, userRoleEntities);
    }
    return map;
  }

  async countUsersWithRole(roleId: string): Promise<number> {
    return this.userRoles.filter((ur) => ur.roleId === roleId).length;
  }
}
