import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { OAuthService } from '@/services/oauth';
import { config } from '@/utils/config';
import logger from '@/utils/logger';

export class OAuthController {
  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const state = req.query.state as string;
      const options: any = {
        scope: ['profile', 'email'],
        accessType: 'offline',
        prompt: 'consent',
      };

      if (state) {
        options.state = state;
      }

      passport.authenticate('google', options)(req, res, next);
    } catch (error) {
      logger.error('Google auth initiation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        message: 'Failed to initiate Google authentication',
      });
    }
  }

  static async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    passport.authenticate('google', { session: false }, async (err: any, user: any) => {
      try {
        if (err) {
          logger.error('Google OAuth callback error', { error: err });
          return res.redirect(`${config.urls.frontend}/login?error=oauth_error`);
        }

        if (!user) {
          logger.warn('No user returned from Google OAuth');
          return res.redirect(`${config.urls.frontend}/login?error=oauth_failed`);
        }

        // Generate JWT tokens
        const tokens = await OAuthService.generateTokensForUser(user);

        logger.info('Google OAuth successful', {
          userId: user.id,
          email: user.email,
        });

        // Redirect to frontend with tokens
        const redirectUrl = new URL(`${config.urls.frontend}/auth/callback`);
        redirectUrl.searchParams.set('access_token', tokens.accessToken);
        redirectUrl.searchParams.set('refresh_token', tokens.refreshToken);
        redirectUrl.searchParams.set('user_id', user.id);

        res.redirect(redirectUrl.toString());
      } catch (error) {
        logger.error('Token generation failed after Google OAuth', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user?.id,
        });

        res.redirect(`${config.urls.frontend}/login?error=token_error`);
      }
    })(req, res, next);
  }

  static async linkGoogle(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Store user ID in session for linking after OAuth
      req.session = req.session || {};
      (req.session as any).linkUserId = req.user.userId;

      // Generate auth URL with linking state
      const authUrl = OAuthService.getAuthUrl('link_account');

      res.json({
        success: true,
        message: 'Google OAuth URL generated',
        data: { authUrl },
      });
    } catch (error) {
      logger.error('Link Google account failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to generate Google OAuth URL',
      });
    }
  }

  static async unlinkGoogle(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const result = await OAuthService.unlinkGoogleAccount(req.user.userId);

      logger.info('Google account unlink requested', {
        userId: req.user.userId,
      });

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Unlink Google account failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unlink Google account',
      });
    }
  }

  static async getOAuthStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // In a more sophisticated implementation, you would check
      // OAuth provider links from a separate table
      const hasGoogleLink = true; // Simplified check

      res.json({
        success: true,
        message: 'OAuth status retrieved',
        data: {
          providers: {
            google: {
              linked: hasGoogleLink,
              email: req.user.email,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Get OAuth status failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve OAuth status',
      });
    }
  }
}