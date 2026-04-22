import { IUserRepository } from "../../repositories/user.repository";
import { AppError } from "../../../core/errors";
import { env } from "../../../config/env";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(data: { email: string; password: string }) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(
        "INVALID_CREDENTIALS",
        "Invalid email or password",
        401,
      );
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new AppError(
        "INVALID_CREDENTIALS",
        "Invalid email or password",
        401,
      );
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
    );

    const refreshToken = jwt.sign({ sub: user.id }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.userRepository.saveRefreshToken(
      user.id,
      refreshToken,
      expiresAt,
    );

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
