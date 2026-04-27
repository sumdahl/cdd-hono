import { IUserRepository } from "../../repositories/user.repository";
import { IRoleRepository } from "../../repositories/role.repository";

export class GetAllUsersUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute() {
    const users = await this.userRepository.findAll();
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roles = await this.roleRepository.findRolesByUserId(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
          roles: roles.map((r) => r.name),
          createdAt: user.createdAt,
        };
      }),
    );
    return usersWithRoles;
  }
}
