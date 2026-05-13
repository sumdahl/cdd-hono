import { IUserRepository } from "../../repositories/user.repository";
import { IRoleRepository } from "../../repositories/role.repository";
import { AppError, ErrorCode } from "../../errors";

export class RemoveRoleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(userId: string, roleName: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    }

    const role = await this.roleRepository.findByName(roleName);
    if (!role) {
      throw new AppError(ErrorCode.ROLE_NOT_FOUND, "Role not found", 404);
    }

    // prevent removing admin role if it would leave system with no admins
    if (roleName === "admin") {
      const adminRole = await this.roleRepository.findByName("admin");
      if (adminRole) {
        const adminCount = await this.roleRepository.countUsersWithRole(
          adminRole.id,
        );
        if (adminCount <= 1) {
          throw new AppError(
            ErrorCode.LAST_ADMIN,
            "Cannot remove the last admin. Assign admin role to another user first.",
            409,
          );
        }
      }
    }

    await this.roleRepository.removeRoleFromUser(userId, role.id);
  }
}
