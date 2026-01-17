import { Router } from "express";
import { sampleController } from "../controllers/sample.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Protected Routes
router.use(requireAuth);

router.get("/", sampleController.getSamples);
router.delete("/:id", sampleController.deleteSample);

export default router;
