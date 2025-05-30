import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@/generated/prisma';
import { config } from '@/utils/config';
import { JWTService } from '@/utils/jwt';
import logger from '@/utils/logger';

const prisma = new PrismaClient();

export interface GoogleProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export class OAuthService {
  static initializePassport() {
    // Configure Google OAuth strategy
    if (config.google.clientId && config.google.clientSecret) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: config.google.clientId,
            clientSecret: config.google.clientSecret,
            callbackURL: config.google.callbackUrl,
            scope: ['profile', 'email'],
          },
          async (accessToken, refreshToken, profile, done) => {
            try {
              const googleProfile: GoogleProfile = {
                id: profile.id,
                email: profile.emails?.[0]?.value || '',
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                avatarUrl: profile.photos?.[0]?.value,
              };

              const user = await OAuthService.handleGoogleAuth(googleProfile);
              return done(null, user);
            } catch (error) {
              logger.error('Google OAuth error', { error });
              return done(error, null);
            }
          }
        )
      );
    }

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id },
          include: { profile: true },
        });
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  static async handleGoogleAuth(googleProfile: GoogleProfile) {
    const { email, firstName, lastName, avatarUrl } = googleProfile;

    if (!email) {
      throw new Error('Email is required from Google profile');
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (user) {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Update profile if missing data
      if (user.profile && (!user.profile.firstName || !user.profile.lastName || !user.profile.avatarUrl)) {
        await prisma.userProfile.update({
          where: { userId: user.id },
          data: {
            firstName: user.profile.firstName || firstName,
            lastName: user.profile.lastName || lastName,
            avatarUrl: user.profile.avatarUrl || avatarUrl,
          },
        });
      }
    } else {
      // Create new user with Google profile data
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: '', // No password for OAuth users
          role: 'client',
          isVerified: true, // Google accounts are pre-verified
          profile: {
            create: {
              firstName,
              lastName,
              avatarUrl,
            },
          },
        },
        include: { profile: true },
      });

      logger.info('New user created via Google OAuth', {
        userId: user.id,
        email: user.email,
      });
    }

    return user;
  }

  static async generateTokensForUser(user: any) {
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshPayload = {
      userId: user.id,
      tokenVersion: 1, // In production, store this in DB
    };

    const accessToken = JWTService.generateAccessToken(jwtPayload);
    const refreshToken = JWTService.generateRefreshToken(refreshPayload);

    return { accessToken, refreshToken };
  }

  static async linkGoogleAccount(userId: string, googleProfile: GoogleProfile) {
    const { email } = googleProfile;

    // Check if Google email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error('This Google account is already linked to another user');
    }

    // Update user's email if different
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.email !== email) {
      await prisma.user.update({
        where: { id: userId },
        data: { email, isVerified: true },
      });
    }

    // Update profile with Google data
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        firstName: googleProfile.firstName,
        lastName: googleProfile.lastName,
        avatarUrl: googleProfile.avatarUrl,
      },
      create: {
        userId,
        firstName: googleProfile.firstName,
        lastName: googleProfile.lastName,
        avatarUrl: googleProfile.avatarUrl,
      },
    });

    logger.info('Google account linked successfully', {
      userId,
      googleEmail: email,
    });

    return { message: 'Google account linked successfully' };
  }

  static async unlinkGoogleAccount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.passwordHash) {
      throw new Error('Cannot unlink Google account without setting a password first');
    }

    // In a more sophisticated implementation, you might:
    // 1. Store OAuth provider info in a separate table
    // 2. Allow multiple OAuth providers per user
    // 3. Track OAuth tokens for API access

    logger.info('Google account unlink requested', { userId });

    return { message: 'To fully unlink Google account, please contact support' };
  }

  static getAuthUrl(state?: string) {
    if (!config.google.clientId) {
      throw new Error('Google OAuth not configured');
    }

    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.callbackUrl || '',
      response_type: 'code',
      scope: 'profile email',
      access_type: 'offline',
      prompt: 'consent',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}