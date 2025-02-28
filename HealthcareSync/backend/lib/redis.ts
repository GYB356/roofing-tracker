import { Redis } from 'ioredis';

class RedisWrapper {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private maxCacheSize = 1000; // Maximum number of cache entries

  constructor() {
    this.initializeRedis().catch(error => {
      console.error('Failed to initialize Redis:', error);
    });
  }

  private async initializeRedis() {
    try {
      this.client = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        connectTimeout: 20000,
        enableReadyCheck: true,
        retryStrategy: (times) => {
          const delay = Math.min(times * 1000, 30000);
          if (times > 20) {
            console.log('Redis connection failed after maximum retries');
            return null;
          }
          return delay;
        },
        tls: {
          rejectUnauthorized: false // Required for Upstash
        }
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('Redis connection ended');
        this.isConnected = false;
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  private async enforceMaxCacheSize(): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys('*');
        if (keys.length > this.maxCacheSize) {
          const keysToRemove = keys.slice(0, keys.length - this.maxCacheSize);
          if (keysToRemove.length) {
            await this.client.del(...keysToRemove);
            console.log(`Removed ${keysToRemove.length} cache entries to maintain size limit`);
          }
        }
      }
    } catch (error) {
      console.error('Error enforcing cache size limit:', error);
    }
  }

  public async getCache<T>(key: string): Promise<T | null> {
    try {
      if (this.isConnected && this.client) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  public async setCache(key: string, data: any, ttl = 300): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.setex(key, ttl, JSON.stringify(data));
        await this.enforceMaxCacheSize();
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  public async invalidateCache(pattern: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length) {
          await this.client.del(...keys);
          console.log(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
        }
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}

export const redis = new RedisWrapper();
export const CACHE_KEYS = {
  ADMIN_STATS: 'admin:stats:',
  STAFF_STATS: 'staff:stats:',
  USER_DATA: 'user:data:',
  APPOINTMENTS: 'appointments:',
  MEDICAL_RECORDS: 'medical:records:', // Added missing MEDICAL_RECORDS key
};

export const getCache = redis.getCache.bind(redis);
export const setCache = redis.setCache.bind(redis);
export const invalidateCache = redis.invalidateCache.bind(redis);