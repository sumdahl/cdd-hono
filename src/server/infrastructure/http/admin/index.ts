import { container } from "../../di/container";
import { createAdminRouter } from "./admin.routes";
import { createAuthMiddleware } from "../middleware/auth.middleware";

export const adminRouter = createAdminRouter(container.cradle, {
  authMiddleware: createAuthMiddleware(container.cradle),
});
