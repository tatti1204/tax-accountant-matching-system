import { Router } from 'express';
import { DiagnosisController } from '@/controllers/diagnosis';
import { requireAuth, requireClient } from '@/middleware/auth';
import {
  saveResultValidation,
  deleteResultValidation,
  limitValidation,
} from '@/middleware/validators/diagnosis';

const router = Router();

// Public routes
router.get('/questions', DiagnosisController.getQuestions);
router.get('/stats', DiagnosisController.getStats);

// Protected routes (require authentication)
router.post('/results', requireClient, saveResultValidation, DiagnosisController.saveResult);
router.get('/results', requireAuth, limitValidation, DiagnosisController.getUserResults);
router.get('/results/latest', requireAuth, DiagnosisController.getLatestResult);
router.delete('/results/:resultId', requireAuth, deleteResultValidation, DiagnosisController.deleteResult);

export default router;