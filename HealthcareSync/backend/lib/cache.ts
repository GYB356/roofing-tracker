import Redis from 'ioredis';

// Initialize Redis client with environment variable
const redis = new Redis(process.env.REDIS_URL!);

// Default cache expiration time (30 minutes)
const DEFAULT_CACHE_TTL = 1800;

export class CacheService {
  private static redis = redis;

  // Get data from cache
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set data in cache with optional TTL
  static async set(key: string, data: any, ttl: number = DEFAULT_CACHE_TTL): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete cache entry
  static async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Get or set cache with callback
  static async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = DEFAULT_CACHE_TTL
  ): Promise<T | null> {
    try {
      const cachedData = await this.get<T>(key);
      if (cachedData) return cachedData;

      const freshData = await callback();
      await this.set(key, freshData, ttl);
      return freshData;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      return null;
    }
  }

  // Clear cache for a specific prefix
  static async clearPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${prefix}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache clearPrefix error:', error);
    }
  }

  // Health check method
  static async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}