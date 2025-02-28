import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auditLog = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user information from the request
      const userId = req.user?.id || null;

      // Check if auditLog model exists in prisma
      if (prisma.$queryRaw) {
        // Use raw query as fallback if model doesn't exist
        await prisma.$executeRaw`
          INSERT INTO "AuditLog" ("userId", "action", "ipAddress", "userAgent", "details", "createdAt") 
          VALUES (${userId}, ${action}, ${req.ip}, ${req.headers['user-agent'] || ''}, 
          ${JSON.stringify({
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            body: req.body
          })}, NOW())
        `.catch(err => console.error('Raw audit log error:', err));
      }

      next();
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Continue processing the request even if audit logging fails
      next();
    }
  };
};

export function auditMiddleware(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store the original end method
    const originalEnd = res.end;

    // Override the end method
    res.end = function (chunk?: any, encoding?: any) {
      // Get resource ID from params if available
      const resourceId = req.params.id ? parseInt(req.params.id) : undefined;

      // Only log if user is authenticated
      if (req.isAuthenticated() && req.user) {
        auditLog(req.user.id, resource, action, resourceId, JSON.stringify({
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          body: action === 'create' || action === 'update' ? req.body : undefined
        }));
      }

      // Call the original end method
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

// Hypothetical claims routes file content (./routes/claims.ts) -  This is an assumption as the original code didn't include it.
//  Replace this with your actual claims routes implementation

export default  {
  // Your claims routes here...  Example:
  getClaims: async (req:Request,res:Response) => {
    res.send("Claims data");
  }
};
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Comprehensive audit logging function
 */
export const auditLog = async (
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: any,
  ip: string,
  userAgent: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress: ip,
        userAgent,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

/**
 * Middleware to log actions for audit purposes
 */
export function auditMiddleware(resourceType: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to capture response
    res.end = function(chunk?: any, encoding?: any, cb?: any): any {
      // Restore original end function
      res.end = originalEnd;
      
      // Get status code and extract resource ID if available
      const statusCode = res.statusCode;
      const resourceId = req.params.id || null;
      
      // Get user ID from authenticated session
      const userId = req.user?.id || null;
      
      // Log the action
      auditLog(
        userId,
        action,
        resourceType,
        resourceId,
        {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.method !== 'GET' ? req.body : undefined,
          statusCode
        },
        req.ip,
        req.headers['user-agent'] || ''
      ).catch(err => console.error('Audit log error:', err));
      
      // Call original end
      return originalEnd.call(this, chunk, encoding, cb);
    };
    
    next();
  };
}
