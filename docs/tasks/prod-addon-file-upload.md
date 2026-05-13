# Production Add-on: File Upload

## Metadata
- **Priority:** Medium
- **Status:** Pending
- **Estimated time:** ~2h
- **Dependencies:** None

## Problem

No multipart/form-data handling. Can't accept avatars, documents, images. Hono supports multipart natively — wiring is missing.

## Solution

### 1. Upload middleware

Hono's built-in `c.req.parseBody()` handles multipart. Add a shared upload utility:

```typescript
// infrastructure/http/shared/upload.ts
import { Context } from "hono";
import { z } from "@hono/zod-openapi";

export type UploadedFile = {
  filename: string;
  data: Buffer;
  mimeType: string;
};

export async function parseUpload(c: Context, field: string): Promise<UploadedFile> {
  const body = await c.req.parseBody();
  const file = body[field];
  if (!file || !(file instanceof File)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, `Missing file: ${field}`, 422);
  }
  return {
    filename: file.name,
    data: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type,
  };
}
```

### 2. Storage adapter interface

```typescript
// core/services/storage.service.ts
export interface IStorageService {
  upload(path: string, data: Buffer, mimeType: string): Promise<string>;
  delete(path: string): Promise<void>;
  getUrl(path: string): string;
}
```

### 3. S3 implementation

```bash
bun add @aws-sdk/client-s3
```

```typescript
// infrastructure/services/s3-storage.service.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IStorageService } from "../../core/services/storage.service";

export class S3StorageService implements IStorageService {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.S3_REGION,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
    });
  }

  async upload(path: string, data: Buffer, mimeType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: path,
      Body: data,
      ContentType: mimeType,
    }));
    return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${path}`;
  }

  async delete(path: string): Promise<void> { /* DeleteObjectCommand */ }
  getUrl(path: string): string { return `https://.../${path}`; }
}
```

### 4. Env vars

```
S3_REGION=us-east-1
S3_BUCKET=my-app-uploads
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
```

### 5. Example domain: avatar upload

```typescript
// core/use-cases/auth/update-avatar.ts
export class UpdateAvatarUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly storageService: IStorageService,
  ) {}

  async execute(userId: string, file: UploadedFile) {
    const extension = file.filename.split(".").pop();
    const path = `avatars/${userId}.${extension}`;
    const url = await this.storageService.upload(path, file.data, file.mimeType);
    // store url on user record if needed, or return directly
    return { avatarUrl: url };
  }
}
```

### 6. Route

```typescript
router.openapi(createRoute({
  method: "post", path: "/auth/avatar",
  request: { body: { content: { "multipart/form-data": { schema: avatarSchema } } } },
  responses: { 200: successResponseSchema(avatarResponseSchema) },
}), async (c) => {
  const userId = c.get("userId");
  const file = await parseUpload(c, "avatar");
  const result = await updateAvatar.execute(userId, file);
  return successHandler(c, result);
});
```

### Test approach

- `MockStorageService` — keeps Map<string, Buffer>, no network calls
- Unit test avatar use-case with mock storage
- Integration test: POST multipart with `FormData` via `app.request()`

## Acceptance Criteria

- [ ] `IStorageService` in core with upload/delete/getUrl
- [ ] `S3StorageService` impl (can test with MinIO locally)
- [ ] Avatar upload endpoint working
- [ ] File type + size validation
- [ ] `bun test` passes
