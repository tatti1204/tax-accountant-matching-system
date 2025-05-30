import { Router } from 'express';
import { OAuthController } from '@/controllers/oauth';
import { requireAuth } from '@/middleware/auth';

const router = Router();

// Google OAuth routes
router.get('/google', OAuthController.googleAuth);
router.get('/google/callback', OAuthController.googleCallback);

// Account linking routes (require authentication)
router.post('/google/link', requireAuth, OAuthController.linkGoogle);
router.delete('/google/link', requireAuth, OAuthController.unlinkGoogle);
router.get('/status', requireAuth, OAuthController.getOAuthStatus);

export default router;