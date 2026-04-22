import { ITokenRepository } from "../../repositories/token.repository";
import { AppError, ErrorCode } from "../../errors";

export class LogoutUseCase {
  constructor(private readonly tokenRepository: ITokenRepository) {}

  async execute(token: string) {
    const stored = await this.tokenRepository.find(token);
    if (!stored) {
      throw new AppError(
        ErrorCode.INVALID_TOKEN,
        "Refresh token not found",
        401,
      );
    }
    await this.tokenRepository.delete(token);
  }
}
