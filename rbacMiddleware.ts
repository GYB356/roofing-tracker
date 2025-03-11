import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

// Define permission structure for time tracking
export const TimeTrackingPermissions = {
  VIEW_OWN_TIME: 'time:view:own',
  CREATE_OWN_TIME: 'time:create:own',
  EDIT_OWN_TIME: 'time:edit:own',
  DELETE_OWN_TIME: 'time:delete:own',
  VIEW_TEAM_TIME: 'time:view:team',
  EDIT_TEAM_TIME: 'time:edit:team',
  APPROVE_TIME: 'time:approve',
  VIEW_ALL_TIME: 'time:view:all',
  EDIT_ALL_TIME: 'time:edit:all',
  MANAGE_RATES: 'time:rates:manage',
  VIEW_REPORTS: 'time:reports:view',
};

// Define role-based permissions
export const RolePermissions = {
  admin: [
    // Admin has all permissions
    ...Object.values(TimeTrackingPermissions),
  ],
  manager: [
    // Managers can view and edit team time entries, approve time,
    // view reports, and manage rates
    TimeTrackingPermissions.VIEW_OWN_TIME,
    TimeTrackingPermissions.CREATE_OWN_TIME,
    TimeTrackingPermissions.EDIT_OWN_TIME,
    TimeTrackingPermissions.DELETE_OWN_TIME,
    TimeTrackingPermissions.VIEW_TEAM_TIME,
    TimeTrackingPermissions.EDIT_TEAM_TIME,
    TimeTrackingPermissions.APPROVE_TIME,
    TimeTrackingPermissions.VIEW_REPORTS,
    TimeTrackingPermissions.MANAGE_RATES,
  ],
  teamLead: [
    // Team leads can view and edit team time entries and approve time
    TimeTrackingPermissions.VIEW_OWN_TIME,
    TimeTrackingPermissions.CREATE_OWN_TIME,
    TimeTrackingPermissions.EDIT_OWN_TIME,
    TimeTrackingPermissions.DELETE_OWN_TIME,
    TimeTrackingPermissions.VIEW_TEAM_TIME,
    TimeTrackingPermissions.EDIT_TEAM_TIME,
    TimeTrackingPermissions.APPROVE_TIME,
    TimeTrackingPermissions.VIEW_REPORTS,
  ],
  user: [
    // Regular users can only manage their own time entries
    TimeTrackingPermissions.VIEW_OWN_TIME,
    TimeTrackingPermissions.CREATE_OWN_TIME,
    TimeTrackingPermissions.EDIT_OWN_TIME,
    TimeTrackingPermissions.DELETE_OWN_TIME,
  ],
  client: [
    // Clients can only view time entries for their projects
    TimeTrackingPermissions.VIEW_OWN_TIME,
  ],
};

// Middleware to authenticate user via JWT
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    
    // Attach user info to request for use in route handlers
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || RolePermissions[decoded.role] || [],
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }
};

// Middleware to check if user has required permissions
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { permissions } = req.user;
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Middleware to check if user belongs to specific roles
export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { role } = req.user;
    
    if (!roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Middleware to check if user is accessing their own resource
export const checkResourceOwnership = (
  resourceField: string = 'userId'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const resourceId = req.params.id;
    
    // If the resource ID is in the query parameters
    if (resourceId && req.method !== 'GET') {
      // Fetch the resource from the database to check ownership
      // This is a placeholder - in a real implementation,
      // you would query your database for the resource
      // const resource = await YourModel.findById(resourceId);
      
      // For demonstration purposes, assuming the resource is already loaded
      const resource = req.resource;
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Check if the user is the owner of the resource
      if (resource[resourceField] !== req.user.id) {
        // Check if the user has permission to modify others' resources
        const hasTeamPermission = req.user.permissions.includes(TimeTrackingPermissions.EDIT_TEAM_TIME);
        const hasAllPermission = req.user.permissions.includes(TimeTrackingPermissions.EDIT_ALL_TIME);
        
        if (!hasTeamPermission && !hasAllPermission) {
          return res.status(403).json({ error: 'You do not have permission to modify this resource' });
        }
      }
    }
    
    next();
  };
};

// Set up permissions for time tracking routes
export const setupTimeTrackingRoutes = (router: any) => {
  // Get time entries - different permissions for own, team, and all
  router.get('/entries', authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
    // Check if requesting own entries, team entries, or all entries
    const { userId, projectId, teamId } = req.query;
    
    if (userId && userId === req.user.id) {
      // User is requesting their own entries
      requirePermission(TimeTrackingPermissions.VIEW_OWN_TIME)(req, res, next);
    } else if (teamId || (userId && userId !== req.user.id)) {
      // User is requesting team entries or another user's entries
      requirePermission(TimeTrackingPermissions.VIEW_TEAM_TIME)(req, res, next);
    } else {
      // User is requesting all entries
      requirePermission(TimeTrackingPermissions.VIEW_ALL_TIME)(req, res, next);
    }
  });
  
  // Create time entry - requires CREATE_OWN_TIME permission
  router.post('/entries', 
    authenticateJWT, 
    requirePermission(TimeTrackingPermissions.CREATE_OWN_TIME)
  );
  
  // Update time entry - requires permissions and ownership check
  router.put('/entries/:id', 
    authenticateJWT, 
    checkResourceOwnership(),
    (req: Request, res: Response, next: NextFunction) => {
      // Determine which permission to check based on ownership
      const resource = req.resource;
      
      if (resource && resource.userId === req.user.id) {
        requirePermission(TimeTrackingPermissions.EDIT_OWN_TIME)(req, res, next);
      } else {
        // Check team or all permissions
        const hasTeamPermission = req.user.permissions.includes(TimeTrackingPermissions.EDIT_TEAM_TIME);
        const hasAllPermission = req.user.permissions.includes(TimeTrackingPermissions.EDIT_ALL_TIME);
        
        if (hasTeamPermission || hasAllPermission) {
          next();
        } else {
          res.status(403).json({ error: 'Insufficient permissions' });
        }
      }
    }
  );
  
  // Delete time entry - requires permissions and ownership check
  router.delete('/entries/:id', 
    authenticateJWT, 
    checkResourceOwnership(),
    (req: Request, res: Response, next: NextFunction) => {
      // Determine which permission to check based on ownership
      const resource = req.resource;
      
      if (resource && resource.userId === req.user.id) {
        requirePermission(TimeTrackingPermissions.DELETE_OWN_TIME)(req, res, next);
      } else {
        // Check team or all permissions
        const hasTeamPermission = req.user.permissions.includes(TimeTrackingPermissions.EDIT_TEAM_TIME);
        const hasAllPermission = req.user.permissions.includes(TimeTrackingPermissions.EDIT_ALL_TIME);
        
        if (hasTeamPermission || hasAllPermission) {
          next();
        } else {
          res.status(403).json({ error: 'Insufficient permissions' });
        }
      }
    }
  );
  
  // Approve time entries - requires APPROVE_TIME permission
  router.post('/entries/approve', 
    authenticateJWT, 
    requirePermission(TimeTrackingPermissions.APPROVE_TIME)
  );
  
  // Get reports - requires VIEW_REPORTS permission
  router.get('/reports', 
    authenticateJWT, 
    requirePermission(TimeTrackingPermissions.VIEW_REPORTS)
  );
  
  // Manage rates - requires MANAGE_RATES permission
  router.all('/rates*', 
    authenticateJWT, 
    requirePermission(TimeTrackingPermissions.MANAGE_RATES)
  );
  
  return router;
}; 