import bcrypt from 'bcrypt';
import { PrismaClient } from '@/generated/prisma';
import { JWTService, JwtPayload, RefreshTokenPayload } from '@/utils/jwt';
import { config } from '@/utils/config';

const prisma = new PrismaClient();

export interface LoginResult {
  user: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role?: 'client' | 'tax_accountant';
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export class AuthService {
  static async register(data: RegisterData): Promise<{ user: any; message: string }> {
    const { email, password, role = 'client', firstName, lastName, companyName } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        profile: {
          create: {
            firstName,
            lastName,
            companyName,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      message: 'User registered successfully. Please verify your email.',
    };
  }

  static async login(email: string, password: string): Promise<LoginResult> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshPayload: RefreshTokenPayload = {
      userId: user.id,
      tokenVersion: 1, // In production, this should be stored in DB
    };

    const accessToken = JWTService.generateAccessToken(jwtPayload);
    const refreshToken = JWTService.generateRefreshToken(refreshPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = JWTService.verifyRefreshToken(refreshToken);
      
      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or deactivated');
      }

      // Generate new tokens
      const jwtPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const newRefreshPayload: RefreshTokenPayload = {
        userId: user.id,
        tokenVersion: payload.tokenVersion,
      };

      const newAccessToken = JWTService.generateAccessToken(jwtPayload);
      const newRefreshToken = JWTService.generateRefreshToken(newRefreshPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        taxAccountant: {
          include: {
            specialties: {
              include: {
                specialty: true,
              },
            },
            pricingPlans: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  static async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // In production, generate a secure reset token and send email
    // For now, just return success message
    
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  static async resetPassword(_token: string, _newPassword: string): Promise<{ message: string }> {
    // In production, verify the reset token and update password
    // For now, just return success message
    
    return { message: 'Password has been reset successfully.' };
  }

  static async verifyEmail(_token: string): Promise<{ message: string }> {
    // In production, verify the email verification token
    // For now, just return success message
    
    return { message: 'Email verified successfully.' };
  }
}