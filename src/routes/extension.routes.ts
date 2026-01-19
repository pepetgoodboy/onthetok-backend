import { Router } from "express";
import { extensionController } from "../controllers/extension.controller";
import {
  requireAuth,
  requireExtensionAuth,
} from "../middlewares/auth.middleware";

const router = Router();

// Public: Verify License (Returns Token)
router.post("/verify-license", extensionController.verifyLicense);

// Protected: Sync Samples (Requires Token)
router.post(
  "/sync-samples",
  requireExtensionAuth,
  extensionController.syncSamples,
);

export default router;
