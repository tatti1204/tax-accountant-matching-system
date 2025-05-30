import { Router } from 'express';
import { TaxAccountantController } from '@/controllers/taxAccountant';
import { requireAuth } from '@/middleware/auth';
import {
  taxAccountantListValidation,
  taxAccountantByIdValidation,
  searchValidation,
  popularValidation,
  taxAccountantRegistrationValidation,
  taxAccountantUpdateValidation,
} from '@/middleware/validators/taxAccountant';

const router = Router();

// Public routes
router.get('/', taxAccountantListValidation, TaxAccountantController.getTaxAccountantList);
router.get('/search', searchValidation, TaxAccountantController.searchTaxAccountants);
router.get('/popular', popularValidation, TaxAccountantController.getPopularTaxAccountants);
router.get('/stats', TaxAccountantController.getTaxAccountantStats);
router.get('/:id', taxAccountantByIdValidation, TaxAccountantController.getTaxAccountantById);

// Protected routes (require authentication)
router.post('/register', requireAuth, taxAccountantRegistrationValidation, TaxAccountantController.registerTaxAccountant);
router.put('/profile', requireAuth, taxAccountantUpdateValidation, TaxAccountantController.updateTaxAccountant);

export default router;