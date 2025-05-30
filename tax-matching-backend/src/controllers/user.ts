import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserService } from '@/services/user';
import logger from '@/utils/logger';

export class UserController {
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const user = await UserService.getUserById(req.user.userId);

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user },
      });
    } catch (error) {
      logger.error('Get profile failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Profile not found',
      });
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
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

      const updateData = req.body;
      
      const updatedProfile = await UserService.updateUserProfile(req.user.userId, updateData);

      logger.info('Profile updated successfully', { 
        userId: req.user.userId,
        updatedFields: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { profile: updatedProfile },
      });
    } catch (error) {
      logger.error('Update profile failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Profile update failed',
      });
    }
  }

  static async updateTaxAccountant(req: Request, res: Response): Promise<void> {
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

      const updateData = req.body;
      
      const updatedTaxAccountant = await UserService.updateTaxAccountant(req.user.userId, updateData);

      logger.info('Tax accountant profile updated successfully', { 
        userId: req.user.userId,
        updatedFields: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Tax accountant profile updated successfully',
        data: { taxAccountant: updatedTaxAccountant },
      });
    } catch (error) {
      logger.error('Update tax accountant profile failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Tax accountant profile update failed',
      });
    }
  }

  static async addSpecialty(req: Request, res: Response): Promise<void> {
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

      const { specialtyId, yearsOfExperience } = req.body;
      
      const specialty = await UserService.addTaxAccountantSpecialty(
        req.user.userId, 
        specialtyId, 
        yearsOfExperience
      );

      logger.info('Specialty added successfully', { 
        userId: req.user.userId,
        specialtyId,
        yearsOfExperience
      });

      res.json({
        success: true,
        message: 'Specialty added successfully',
        data: { specialty },
      });
    } catch (error) {
      logger.error('Add specialty failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Add specialty failed',
      });
    }
  }

  static async removeSpecialty(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { specialtyId } = req.params;
      
      await UserService.removeTaxAccountantSpecialty(req.user.userId, specialtyId);

      logger.info('Specialty removed successfully', { 
        userId: req.user.userId,
        specialtyId
      });

      res.json({
        success: true,
        message: 'Specialty removed successfully',
      });
    } catch (error) {
      logger.error('Remove specialty failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Remove specialty failed',
      });
    }
  }

  static async getConsultations(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await UserService.getUserConsultations(req.user.userId, page, limit);

      res.json({
        success: true,
        message: 'Consultations retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Get consultations failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve consultations',
      });
    }
  }

  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await UserService.getUserNotifications(req.user.userId, page, limit);

      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Get notifications failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications',
      });
    }
  }

  static async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { notificationId } = req.params;
      
      const notification = await UserService.markNotificationAsRead(req.user.userId, notificationId);

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: { notification },
      });
    } catch (error) {
      logger.error('Mark notification as read failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark notification as read',
      });
    }
  }

  static async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      await UserService.markAllNotificationsAsRead(req.user.userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      logger.error('Mark all notifications as read failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
      });
    }
  }

  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      await UserService.deleteUser(req.user.userId);

      logger.info('Account deleted successfully', { userId: req.user.userId });

      res.json({
        success: true,
        message: 'Account deactivated successfully',
      });
    } catch (error) {
      logger.error('Delete account failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete account',
      });
    }
  }

  static async getSpecialties(_req: Request, res: Response): Promise<void> {
    try {
      const specialties = await UserService.getSpecialties();

      res.json({
        success: true,
        message: 'Specialties retrieved successfully',
        data: { specialties },
      });
    } catch (error) {
      logger.error('Get specialties failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve specialties',
      });
    }
  }
}