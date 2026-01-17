import { Router } from "express";
import { campaignController } from "../controllers/campaign.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Apply Auth Middleware to all routes
router.use(requireAuth);

router.post("/", campaignController.create);
router.get("/", campaignController.getAll);
router.get("/:id", campaignController.getById);
router.patch("/:id", campaignController.update);
router.delete("/:id", campaignController.delete);

export default router;
