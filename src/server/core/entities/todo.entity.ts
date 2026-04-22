export class TodoEntity {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly isCompleted: boolean = false,
  ) {}
}
