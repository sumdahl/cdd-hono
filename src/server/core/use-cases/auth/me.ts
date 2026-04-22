import { IUserRepository } from "../../repositories/user.repository";
import { AppError } from "../../../core/errors";
import { ErrorCode } from "../../../core/errors";

export class MeUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    }
    return { id: user.id, email: user.email, name: user.name };
  }
}
