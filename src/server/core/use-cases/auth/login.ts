import { IUserRepository } from "../../repositories/user.repository";
import { ITokenRepository } from "../../repositories/token.repository";
import { IRoleRepository } from "../../repositories/role.repository";
import { AppError, ErrorCode } from "../../errors";
import { ITokenService } from "../../services/token.service";
import bcrypt from "bcryptjs";

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: ITokenRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(data: { email: string; password: string }) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(
        ErrorCode.INVALID_CREDENTIALS,
        "Invalid email or password",
        401,
      );
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new AppError(
        ErrorCode.INVALID_CREDENTIALS,
        "Invalid email or password",
        401,
      );
    }

    if (!user.isVerified) {
      throw new AppError(
        ErrorCode.EMAIL_NOT_VERIFIED,
        "Please verify your email before logging in",
        403,
      );
    }

    const userRoles = await this.roleRepository.findRolesByUserId(user.id);
    const roleNames = userRoles.map((r) => r.name);

    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
    });

    const refreshToken = await this.tokenService.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.tokenRepository.save(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: roleNames,
      },
    };
  }
}
