import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DiagnosisService, DiagnosisAnswers } from '@/services/diagnosis';
import logger from '@/utils/logger';

export class DiagnosisController {
  static async getQuestions(_req: Request, res: Response): Promise<void> {
    try {
      const questions = await DiagnosisService.getQuestions();

      res.json({
        success: true,
        message: 'Diagnosis questions retrieved successfully',
        data: { questions },
      });
    } catch (error) {
      logger.error('Get diagnosis questions failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve diagnosis questions',
      });
    }
  }

  static async saveResult(req: Request, res: Response): Promise<void> {
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

      const { answers } = req.body;
      
      // Extract preferences from answers
      const preferences = DiagnosisService.extractPreferencesFromAnswers(answers as DiagnosisAnswers);

      const result = await DiagnosisService.saveDiagnosisResult({
        userId: req.user.userId,
        answers: answers as DiagnosisAnswers,
        preferences,
      });

      logger.info('Diagnosis result saved successfully', { 
        userId: req.user.userId,
        resultId: result.id
      });

      res.json({
        success: true,
        message: 'Diagnosis result saved successfully',
        data: { 
          result: {
            ...result,
            answers: JSON.parse(result.answersJson as string),
            preferences: result.preferencesJson ? JSON.parse(result.preferencesJson as string) : null,
            answersJson: undefined,
            preferencesJson: undefined,
          }
        },
      });
    } catch (error) {
      logger.error('Save diagnosis result failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to save diagnosis result',
      });
    }
  }

  static async getUserResults(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;

      const results = await DiagnosisService.getUserDiagnosisResults(req.user.userId, limit);

      res.json({
        success: true,
        message: 'Diagnosis results retrieved successfully',
        data: { results },
      });
    } catch (error) {
      logger.error('Get user diagnosis results failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve diagnosis results',
      });
    }
  }

  static async getLatestResult(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const result = await DiagnosisService.getLatestDiagnosisResult(req.user.userId);

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'No diagnosis result found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Latest diagnosis result retrieved successfully',
        data: { result },
      });
    } catch (error) {
      logger.error('Get latest diagnosis result failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve latest diagnosis result',
      });
    }
  }

  static async deleteResult(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { resultId } = req.params;

      const result = await DiagnosisService.deleteDiagnosisResult(req.user.userId, resultId);

      logger.info('Diagnosis result deleted successfully', { 
        userId: req.user.userId,
        resultId
      });

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Delete diagnosis result failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        resultId: req.params.resultId 
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete diagnosis result',
      });
    }
  }

  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await DiagnosisService.getDiagnosisStats();

      res.json({
        success: true,
        message: 'Diagnosis statistics retrieved successfully',
        data: { stats },
      });
    } catch (error) {
      logger.error('Get diagnosis stats failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve diagnosis statistics',
      });
    }
  }
}