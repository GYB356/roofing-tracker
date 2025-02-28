import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware to authenticate JWT tokens
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for token in headers or cookies
    const token = 
      (req.headers.authorization && req.headers.authorization.split(' ')[1]) || 
      req.cookies?.token;

    if (!token) {
      // Allow request to proceed without authentication
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as {
        id: string;
        email: string;
        role: string;
      };

      // Set user info in request
      req.user = decoded;
      next();
    } catch (error) {
      // Invalid token, but still proceed without authentication
      next();
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  next();
};

// Middleware to require specific role
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Unauthorized access', 403));
    }

    next();
  };
};

// Rate limiting middleware
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100, // limit each IP to 100 requests per windowMs
  message: string = 'Too many requests from this IP, please try again later'
) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Commonly used rate limiters
export const authRateLimit = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  5, // 5 requests
  'Too many authentication attempts, please try again later'
);

export const apiRateLimit = createRateLimiter();


// Alias for backward compatibility 
export const authorize = requireRole;

// Token generation utilities
export const generateToken = (user: { id: string; role: string; email?: string | null }) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Audit logging middleware for HIPAA compliance
export const auditLog = (action: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user?.id || 'unauthenticated';
    const userRole = req.user?.role || 'none';
    const path = req.path;
    const method = req.method;
    const ip = req.ip;

    console.log(
      `AUDIT: ${new Date().toISOString()} | ` +
        `User ${userId} (${userRole}) | ${action} | ` +
        `${method} ${path} | IP: ${ip}`
    );

    next();
  };
};

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined');
}

import { rateLimit } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) Check if token exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Verify token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // 3) Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    next(error);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};
