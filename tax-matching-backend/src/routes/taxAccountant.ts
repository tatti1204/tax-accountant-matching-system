import { Router } from 'express';
import { TaxAccountantController } from '@/controllers/taxAccountant';
import {
  taxAccountantListValidation,
  taxAccountantByIdValidation,
  searchValidation,
  popularValidation,
} from '@/middleware/validators/taxAccountant';

const router = Router();

// Public routes
router.get('/', taxAccountantListValidation, TaxAccountantController.getTaxAccountantList);
router.get('/search', searchValidation, TaxAccountantController.searchTaxAccountants);
router.get('/popular', popularValidation, TaxAccountantController.getPopularTaxAccountants);
router.get('/stats', TaxAccountantController.getTaxAccountantStats);
router.get('/:id', taxAccountantByIdValidation, TaxAccountantController.getTaxAccountantById);

export default router;