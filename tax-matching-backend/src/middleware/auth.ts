import { Request, Response, NextFunction } from 'express';
import { JWTService, JwtPayload } from '@/utils/jwt';
import { UserRole } from '@/generated/prisma';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = JWTService.getTokenFromHeader(req.headers.authorization);
    const payload = JWTService.verifyAccessToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
};

export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const requireAuth = [authenticateToken];
export const requireAdmin = [authenticateToken, requireRole('admin')];
export const requireClient = [authenticateToken, requireRole('client')];
export const requireTaxAccountant = [authenticateToken, requireRole('tax_accountant')];
export const requireClientOrTaxAccountant = [
  authenticateToken, 
  requireRole(['client', 'tax_accountant'])
];