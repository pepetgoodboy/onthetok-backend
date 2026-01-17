import { Router } from "express";
import { affiliatorController } from "../controllers/affiliator.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Apply Auth Middleware
router.use(requireAuth);

router.post("/", affiliatorController.create);
router.post("/import", affiliatorController.bulkImport);
router.get("/", affiliatorController.getAll);
router.get("/:id", affiliatorController.getById);
router.patch("/:id", affiliatorController.update);
router.delete("/:id", affiliatorController.delete);

export default router;
