import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { MatchingService } from '@/services/matching';
import { DiagnosisService } from '@/services/diagnosis';
import { PrismaClient } from '@/generated/prisma';
import logger from '@/utils/logger';

const prisma = new PrismaClient();

export class MatchingController {
  static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { diagnosisResultId } = req.params;

      // Verify the diagnosis result belongs to the user
      const diagnosisResult = await prisma.aIDiagnosisResult.findFirst({
        where: {
          id: diagnosisResultId,
          userId: req.user.userId,
        },
      });

      if (!diagnosisResult) {
        res.status(404).json({
          success: false,
          message: 'Diagnosis result not found',
        });
        return;
      }

      const results = await MatchingService.getMatchingResults(diagnosisResultId);

      res.json({
        success: true,
        message: 'Recommendations retrieved successfully',
        data: { recommendations: results },
      });
    } catch (error) {
      logger.error('Get recommendations failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        diagnosisResultId: req.params.diagnosisResultId 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recommendations',
      });
    }
  }

  static async regenerateMatches(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { diagnosisResultId } = req.params;
      const { criteria } = req.body;

      // Verify the diagnosis result belongs to the user
      const diagnosisResult = await prisma.aIDiagnosisResult.findFirst({
        where: {
          id: diagnosisResultId,
          userId: req.user.userId,
        },
      });

      if (!diagnosisResult) {
        res.status(404).json({
          success: false,
          message: 'Diagnosis result not found',
        });
        return;
      }

      // Use existing preferences if no criteria provided
      const matchingCriteria = criteria || 
        (diagnosisResult.preferencesJson ? JSON.parse(diagnosisResult.preferencesJson as string) : {});

      // Delete existing matching results
      await prisma.matchingResult.deleteMany({
        where: { diagnosisResultId },
      });

      // Generate new matches
      const matches = await MatchingService.generateMatches(
        diagnosisResultId,
        matchingCriteria,
        5
      );

      logger.info('Matches regenerated successfully', { 
        userId: req.user.userId,
        diagnosisResultId,
        matchCount: matches.length
      });

      res.json({
        success: true,
        message: 'Matches regenerated successfully',
        data: { matches },
      });
    } catch (error) {
      logger.error('Regenerate matches failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        diagnosisResultId: req.params.diagnosisResultId 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to regenerate matches',
      });
    }
  }

  static async getRecommendedTaxAccountants(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const includeMatchScore = req.query.includeMatchScore === 'true';

      // Get the user's latest diagnosis result
      const latestDiagnosis = await DiagnosisService.getLatestDiagnosisResult(req.user.userId);

      if (!latestDiagnosis) {
        res.status(404).json({
          success: false,
          message: 'No diagnosis result found. Please complete the diagnosis first.',
        });
        return;
      }

      // Get existing matching results or generate new ones
      let recommendations = await MatchingService.getMatchingResults(latestDiagnosis.id);
      
      if (recommendations.length === 0 && latestDiagnosis.preferences) {
        // Generate matches if none exist
        await MatchingService.generateMatches(
          latestDiagnosis.id,
          latestDiagnosis.preferences,
          limit
        );
        recommendations = await MatchingService.getMatchingResults(latestDiagnosis.id);
      }

      // Limit results and optionally include match scores
      const limitedRecommendations = recommendations.slice(0, limit).map(rec => {
        if (!includeMatchScore) {
          const { matchingScore, matchingReasons, rank, ...cleanRec } = rec;
          return cleanRec;
        }
        return rec;
      });

      logger.info('Recommended tax accountants retrieved', {
        userId: req.user.userId,
        recommendationCount: limitedRecommendations.length,
        includeMatchScore
      });

      res.json({
        success: true,
        message: 'Recommended tax accountants retrieved successfully',
        data: { recommendations: limitedRecommendations },
      });
    } catch (error) {
      logger.error('Get recommended tax accountants failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recommended tax accountants',
      });
    }
  }

  static async getMatchingStats(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

      const stats = await MatchingService.getMatchingStats(fromDate, toDate);

      res.json({
        success: true,
        message: 'Matching statistics retrieved successfully',
        data: { stats },
      });
    } catch (error) {
      logger.error('Get matching stats failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve matching statistics',
      });
    }
  }
}