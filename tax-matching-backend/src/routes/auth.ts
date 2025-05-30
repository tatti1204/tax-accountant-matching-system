import { Router } from 'express';
import { AuthController } from '@/controllers/auth';
import { requireAuth } from '@/middleware/auth';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  requestPasswordResetValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  refreshTokenValidation,
} from '@/middleware/validators/auth';

const router = Router();

// Public routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.post('/refresh-token', refreshTokenValidation, AuthController.refreshToken);
router.post('/request-password-reset', requestPasswordResetValidation, AuthController.requestPasswordReset);
router.post('/reset-password', resetPasswordValidation, AuthController.resetPassword);
router.get('/verify-email/:token', verifyEmailValidation, AuthController.verifyEmail);

// Protected routes
router.get('/profile', requireAuth, AuthController.getProfile);
router.post('/change-password', requireAuth, changePasswordValidation, AuthController.changePassword);
router.post('/logout', requireAuth, AuthController.logout);

export default router;