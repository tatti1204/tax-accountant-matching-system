import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { TaxAccountantService } from '@/services/taxAccountant';
import logger from '@/utils/logger';

export class TaxAccountantController {
  static async getTaxAccountantList(req: Request, res: Response): Promise<void> {
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

      const {
        specialties,
        prefecture,
        minPrice,
        maxPrice,
        minRating,
        minExperience,
        isAcceptingClients,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const filters = {
        specialties: specialties ? (Array.isArray(specialties) ? specialties : [specialties]) as string[] : undefined,
        prefecture: prefecture as string,
        minPrice: minPrice ? parseInt(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        minExperience: minExperience ? parseInt(minExperience as string) : undefined,
        isAcceptingClients: isAcceptingClients ? isAcceptingClients === 'true' : true,
        search: search as string,
      };

      const options = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        sortBy: sortBy as 'rating' | 'experience' | 'price' | 'reviews' || 'rating',
        sortOrder: sortOrder as 'asc' | 'desc' || 'desc',
      };

      const result = await TaxAccountantService.getTaxAccountantList(filters, options);

      res.json({
        success: true,
        message: 'Tax accountants retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Get tax accountant list failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tax accountants',
      });
    }
  }

  static async getTaxAccountantById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Tax accountant ID is required',
        });
        return;
      }

      const taxAccountant = await TaxAccountantService.getTaxAccountantById(id);

      res.json({
        success: true,
        message: 'Tax accountant details retrieved successfully',
        data: { taxAccountant },
      });
    } catch (error) {
      logger.error('Get tax accountant by ID failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        taxAccountantId: req.params.id
      });

      const statusCode = error instanceof Error && error.message === 'Tax accountant not found' ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve tax accountant',
      });
    }
  }

  static async searchTaxAccountants(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, limit } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const searchLimit = limit ? parseInt(limit as string) : 10;
      
      const results = await TaxAccountantService.searchTaxAccountants(query, searchLimit);

      res.json({
        success: true,
        message: 'Search completed successfully',
        data: { results },
      });
    } catch (error) {
      logger.error('Search tax accountants failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query.q
      });

      res.status(500).json({
        success: false,
        message: 'Search failed',
      });
    }
  }

  static async getPopularTaxAccountants(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const searchLimit = limit ? parseInt(limit as string) : 6;
      
      const taxAccountants = await TaxAccountantService.getPopularTaxAccountants(searchLimit);

      res.json({
        success: true,
        message: 'Popular tax accountants retrieved successfully',
        data: { taxAccountants },
      });
    } catch (error) {
      logger.error('Get popular tax accountants failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve popular tax accountants',
      });
    }
  }

  static async getTaxAccountantStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await TaxAccountantService.getTaxAccountantStats();

      res.json({
        success: true,
        message: 'Tax accountant statistics retrieved successfully',
        data: { stats },
      });
    } catch (error) {
      logger.error('Get tax accountant stats failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
      });
    }
  }
}