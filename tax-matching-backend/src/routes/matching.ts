import { Router } from 'express';
import { MatchingController } from '@/controllers/matching';
import { requireAuth } from '@/middleware/auth';
import {
  getRecommendationsValidation,
  regenerateMatchesValidation,
  getRecommendedTaxAccountantsValidation,
  getMatchingStatsValidation,
} from '@/middleware/validators/matching';

const router = Router();

// Protected routes - require authentication
router.get('/recommendations/:diagnosisResultId', requireAuth, getRecommendationsValidation, MatchingController.getRecommendations);
router.post('/regenerate/:diagnosisResultId', requireAuth, regenerateMatchesValidation, MatchingController.regenerateMatches);
router.get('/recommended', requireAuth, getRecommendedTaxAccountantsValidation, MatchingController.getRecommendedTaxAccountants);

// Public routes
router.get('/stats', getMatchingStatsValidation, MatchingController.getMatchingStats);

export default router;