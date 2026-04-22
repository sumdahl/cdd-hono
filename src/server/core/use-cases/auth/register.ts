import { IUserRepository } from "../../repositories/user.repository";
import { AppError } from "../../errors";
import bcrypt from "bcryptjs";

export class RegisterUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(data: { email: string; name: string; password: string }) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("EMAIL_TAKEN", "Email already in use", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.userRepository.create({
      email: data.email,
      name: data.name,
      passwordHash,
    });

    return { id: user.id, email: user.email, name: user.name };
  }
}
