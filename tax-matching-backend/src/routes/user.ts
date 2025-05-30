import { Router } from 'express';
import { UserController } from '@/controllers/user';
import { requireAuth, requireTaxAccountant } from '@/middleware/auth';
import {
  updateProfileValidation,
  updateTaxAccountantValidation,
  addSpecialtyValidation,
  removeSpecialtyValidation,
  paginationValidation,
  notificationValidation,
} from '@/middleware/validators/user';

const router = Router();

// User profile routes
router.get('/profile', requireAuth, UserController.getProfile);
router.put('/profile', requireAuth, updateProfileValidation, UserController.updateProfile);
router.delete('/account', requireAuth, UserController.deleteAccount);

// Tax accountant specific routes
router.put('/tax-accountant', requireTaxAccountant, updateTaxAccountantValidation, UserController.updateTaxAccountant);
router.post('/tax-accountant/specialties', requireTaxAccountant, addSpecialtyValidation, UserController.addSpecialty);
router.delete('/tax-accountant/specialties/:specialtyId', requireTaxAccountant, removeSpecialtyValidation, UserController.removeSpecialty);

// Consultations
router.get('/consultations', requireAuth, paginationValidation, UserController.getConsultations);

// Notifications
router.get('/notifications', requireAuth, paginationValidation, UserController.getNotifications);
router.patch('/notifications/:notificationId/read', requireAuth, notificationValidation, UserController.markNotificationAsRead);
router.patch('/notifications/read-all', requireAuth, UserController.markAllNotificationsAsRead);

// Public routes
router.get('/specialties', UserController.getSpecialties);

export default router;