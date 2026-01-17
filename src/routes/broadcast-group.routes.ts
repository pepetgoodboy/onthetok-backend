import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { broadcastGroupController } from "../controllers/broadcast-group.controller";

const router = Router();

router.use(requireAuth);

router.get("/", broadcastGroupController.getAll);
router.post("/", broadcastGroupController.create);
router.patch("/:id", broadcastGroupController.update);
router.delete("/:id", broadcastGroupController.delete);

export default router;
