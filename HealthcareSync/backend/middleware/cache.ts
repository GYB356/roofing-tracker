import { Request, Response, NextFunction } from 'express';
import { getCache, setCache, CACHE_KEYS } from '../lib/redis';

const DEFAULT_TTL = 300; // 5 minutes
const CACHE_SIZE_LIMIT = 1000; // Maximum number of cache entries

interface CacheOptions {
  ttl?: number;
  keyPrefix: string;
  condition?: (req: Request) => boolean;
}

// Cache middleware factory with enhanced error handling and optimization
export function cacheMiddleware({ 
  keyPrefix, 
  ttl = DEFAULT_TTL,
  condition = (req) => req.method === 'GET' && req.isAuthenticated()
}: CacheOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!condition(req)) {
      return next();
    }

    // Generate cache key including user context and query parameters
    const cacheKey = `${keyPrefix}:${req.url}:${req.user?.id}:${JSON.stringify(req.query)}`;

    try {
      // Try to get data from cache
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        // Add cache hit headers for debugging
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      res.setHeader('X-Cache', 'MISS');

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = function(data: any) {
        // Don't cache error responses
        if (res.statusCode >= 400) {
          return originalJson(data);
        }

        // Cache the data before sending response
        setCache(cacheKey, data, ttl).catch(error => {
          console.error('Cache middleware error:', error);
        });

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // On cache error, continue without caching
      next();
    }
  };
}

// Specific cache middleware instances with optimized TTLs
export const adminStatsCache = cacheMiddleware({
  keyPrefix: CACHE_KEYS.ADMIN_STATS,
  ttl: 30, // 30 seconds TTL for frequently changing stats
  condition: (req) => req.method === 'GET' && req.isAuthenticated() && req.user?.role === 'admin'
});

export const staffStatsCache = cacheMiddleware({
  keyPrefix: CACHE_KEYS.STAFF_STATS,
  ttl: 30,
  condition: (req) => req.method === 'GET' && req.isAuthenticated() && req.user?.role === 'staff'
});

export const userDataCache = cacheMiddleware({
  keyPrefix: CACHE_KEYS.USER_DATA,
  ttl: 300, // 5 minutes TTL for relatively static user data
});

export const appointmentsCache = cacheMiddleware({
  keyPrefix: CACHE_KEYS.APPOINTMENTS,
  ttl: 60, // 1 minute TTL for appointment data
});

export const medicalRecordsCache = cacheMiddleware({
  keyPrefix: CACHE_KEYS.MEDICAL_RECORDS,
  ttl: 600, // 10 minutes TTL for medical records
  condition: (req) => {
    return req.method === 'GET' && 
           req.isAuthenticated() && 
           ['staff', 'admin', 'doctor'].includes(req.user?.role || '');
  }
});