import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { requireAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Apply requireAdmin middleware to all admin routes
router.use(requireAdmin);

// User Management
router.post("/users", userController.createUser);
router.get("/users", userController.getUsers);
router.patch("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

// License Management
router.post("/licenses", userController.generateLicense);

export default router;
