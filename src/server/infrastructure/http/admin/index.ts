import { container } from "../../di/container";
import { createAdminRouter } from "./admin.routes";
import { createAuthMiddleware } from "../middleware/auth.middleware";

const {
  getAllUsersUseCase,
  getUserByIdUseCase,
  deleteUserUseCase,
  getAllRolesUseCase,
  assignRoleUseCase,
  removeRoleUseCase,
  tokenService,
  userRepository,
  tokenBlacklistService,
} = container.cradle;

export const adminRouter = createAdminRouter(
  {
    getAllUsers: getAllUsersUseCase,
    getUserById: getUserByIdUseCase,
    deleteUser: deleteUserUseCase,
    getAllRoles: getAllRolesUseCase,
    assignRole: assignRoleUseCase,
    removeRole: removeRoleUseCase,
  },
  {
    authMiddleware: createAuthMiddleware({
      tokenService,
      userRepository,
      tokenBlacklistService,
    }),
  },
);
