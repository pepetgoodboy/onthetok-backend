import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { userController } from '../controllers/user.controller';
import * as whatsappController from '../controllers/whatsapp.controller';

const router = Router();

// Profile Routes
router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, userController.updateProfile);
router.post('/change-password', requireAuth, userController.changePassword);

// Subscription Routes
router.get('/subscription', requireAuth, userController.getSubscription);

// WhatsApp Routes
router.post('/whatsapp/create', requireAuth, whatsappController.createInstance);
router.get('/whatsapp/connect', requireAuth, whatsappController.connectInstance); // Get QR
router.get('/whatsapp/status', requireAuth, whatsappController.getInstanceStatus);
router.delete('/whatsapp/logout', requireAuth, whatsappController.logoutInstance);
// router.post('/whatsapp/webhook/logout', whatsappController.handleWebhookLogout); // Public webhook

export default router;
