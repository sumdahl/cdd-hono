export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: 400 | 401 | 403 | 404 | 409 | 422 | 500 = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}
