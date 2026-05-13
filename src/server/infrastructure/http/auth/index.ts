import { container } from "../../di/container";
import { createAuthRouter } from "./auth.routes";
import { createAuthMiddleware } from "../middleware/auth.middleware";

export const authRouter = createAuthRouter(container.cradle, {
  authMiddleware: createAuthMiddleware(container.cradle),
});
