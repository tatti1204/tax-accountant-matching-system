import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '@/services/auth';
import logger from '@/utils/logger';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
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

      const { email, password, role, firstName, lastName, companyName } = req.body;

      const result = await AuthService.register({
        email,
        password,
        role,
        firstName,
        lastName,
        companyName,
      });

      logger.info('User registered successfully', { 
        userId: result.user.id, 
        email: result.user.email,
        role: result.user.role 
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      logger.error('Registration failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email 
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
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

      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      logger.info('User logged in successfully', { 
        userId: result.user.id, 
        email: result.user.email,
        role: result.user.role 
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      logger.error('Login failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email 
      });

      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Token refresh failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Token refresh failed',
      });
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const user = await AuthService.getUserById(req.user.userId);

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

  static async changePassword(req: Request, res: Response): Promise<void> {
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

      const { currentPassword, newPassword } = req.body;

      await AuthService.changePassword(req.user.userId, currentPassword, newPassword);

      logger.info('Password changed successfully', { userId: req.user.userId });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Change password failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Password change failed',
      });
    }
  }

  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
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

      const { email } = req.body;

      const result = await AuthService.requestPasswordReset(email);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Password reset request failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email 
      });

      res.status(500).json({
        success: false,
        message: 'Password reset request failed',
      });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
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

      const { token, newPassword } = req.body;

      const result = await AuthService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Password reset failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed',
      });
    }
  }

  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Verification token is required',
        });
        return;
      }

      const result = await AuthService.verifyEmail(token);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Email verification failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        token: req.params.token 
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Email verification failed',
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a stateless JWT system, logout is mainly client-side
      // In production, you might want to blacklist the token
      
      logger.info('User logged out', { userId: req.user?.userId });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }
}