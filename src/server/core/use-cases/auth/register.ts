import { IUserRepository } from "../../repositories/user.repository";
import { IVerificationTokenRepository } from "../../repositories/verification-token.repository";
import { IRoleRepository } from "../../repositories/role.repository";
import { IEmailService } from "../../services/email.service";
import { AppError, ErrorCode } from "../../errors";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly emailService: IEmailService,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(data: { email: string; name: string; password: string }) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError(ErrorCode.EMAIL_TAKEN, "Email already in use", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.userRepository.create({
      email: data.email,
      name: data.name,
      passwordHash,
    });

    // assign default user role
    const userRole = await this.roleRepository.findByName("user");
    if (userRole) {
      await this.roleRepository.assignRoleToUser(user.id, userRole.id);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.verificationTokenRepository.save(user.id, token, expiresAt);

    let verificationEmailSent = false;
    try {
      await this.emailService.sendVerificationEmail(user.email, user.name, token);
      verificationEmailSent = true;
    } catch (err) {
      console.error(
        "[RegisterUseCase] Failed to send verification email to:",
        user.email,
        err,
      );
    }

    return { id: user.id, email: user.email, name: user.name, verificationEmailSent };
  }
}
