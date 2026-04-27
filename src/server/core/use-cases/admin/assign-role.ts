import { IUserRepository } from "../../repositories/user.repository";
import { IRoleRepository } from "../../repositories/role.repository";
import { AppError, ErrorCode } from "../../errors";

export class AssignRoleUseCase {
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

    await this.roleRepository.assignRoleToUser(userId, role.id);
  }
}
