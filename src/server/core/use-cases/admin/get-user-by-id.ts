import { IUserRepository } from "../../repositories/user.repository";
import { IRoleRepository } from "../../repositories/role.repository";
import { AppError, ErrorCode } from "../../errors";

export class GetUserByIdUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    }

    const roles = await this.roleRepository.findRolesByUserId(user.id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      roles: roles.map((r) => r.name),
      createdAt: user.createdAt,
    };
  }
}
