import { container } from "../../di/container";
import { createAdminRouter } from "./admin.routes";

const {
  getAllUsersUseCase,
  getUserByIdUseCase,
  deleteUserUseCase,
  getAllRolesUseCase,
  assignRoleUseCase,
  removeRoleUseCase,
} = container.cradle;

export const adminRouter = createAdminRouter(
  getAllUsersUseCase,
  getUserByIdUseCase,
  deleteUserUseCase,
  getAllRolesUseCase,
  assignRoleUseCase,
  removeRoleUseCase,
);
