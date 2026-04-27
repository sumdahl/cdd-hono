import { IUserRepository } from "../../repositories/user.repository";
import { AppError, ErrorCode } from "../../errors";

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, requestingUserId: string) {
    if (userId === requestingUserId) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Cannot delete your own account",
        403,
      );
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    }

    await this.userRepository.delete(userId);
  }
}
