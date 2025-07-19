import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        isAdmin?: boolean;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log(`🚫 [AUTH] No token provided for ${req.method} ${req.originalUrl} from ${req.ip}`);
    return res.status(401).json({ 
      error: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = JWTUtils.verifyToken(token);
    req.user = decoded;
    console.log(`✅ [AUTH] User ${decoded.userId} (${decoded.email}) authenticated for ${req.method} ${req.originalUrl}`);
    next();
  } catch (error) {
    console.log(`🚫 [AUTH] Invalid token for ${req.method} ${req.originalUrl} from ${req.ip}`);
    return res.status(403).json({ 
      error: 'Invalid or expired token.' 
    });
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = JWTUtils.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we continue without user
      req.user = undefined;
    }
  }

  next();
};

// Admin-only middleware - requires authentication + admin role
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log(`🚫 [ADMIN] No token provided for ${req.method} ${req.originalUrl} from ${req.ip}`);
    return res.status(401).json({ 
      error: 'Access denied. Authentication required.' 
    });
  }

  try {
    // Verify token
    const decoded = JWTUtils.verifyToken(token);
    
    // Get user from database to check admin status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isAdmin: true, isActive: true }
    });

    if (!user) {
      console.log(`🚫 [ADMIN] User ${decoded.userId} not found for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ 
        error: 'User not found.' 
      });
    }

    if (!user.isActive) {
      console.log(`🚫 [ADMIN] Inactive user ${decoded.userId} attempted admin access for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ 
        error: 'Account is deactivated.' 
      });
    }

    if (!user.isAdmin) {
      console.log(`🚫 [ADMIN] Non-admin user ${decoded.userId} (${decoded.email}) attempted admin access for ${req.method} ${req.originalUrl}`);
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    // Add user info to request including admin status
    req.user = {
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    };

    console.log(`✅ [ADMIN] Admin user ${user.id} (${user.email}) authenticated for ${req.method} ${req.originalUrl}`);
    next();
    
  } catch (error) {
    console.log(`🚫 [ADMIN] Invalid token for ${req.method} ${req.originalUrl} from ${req.ip}:`, error);
    return res.status(403).json({ 
      error: 'Invalid or expired token.' 
    });
  }
};