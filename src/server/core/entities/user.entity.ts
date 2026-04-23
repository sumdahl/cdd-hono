export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly isVerified: boolean,
    public readonly createdAt: Date,
  ) {}
}
