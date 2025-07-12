import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/auth';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
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