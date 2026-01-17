import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { broadcastController } from "../controllers/broadcast.controller";

const router = Router();

router.use(requireAuth);

router.post("/generate-message", broadcastController.generateMessage);
router.post("/send", broadcastController.sendBroadcast);
router.get("/status", broadcastController.getStatus);
router.get("/history", broadcastController.getLogs);

export default router;
