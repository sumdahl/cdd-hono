import { IRoleRepository } from "../../repositories/role.repository";

export class GetAllRolesUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute() {
    const roles = await this.roleRepository.findAll();
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.createdAt,
    }));
  }
}
