// Type declarations for modules without types

declare module 'rate-limiter-flexible' {
  export class RateLimiterMemory {
    constructor(options: any);
    consume(key: string, points?: number): Promise<any>;
  }
}

declare module 'drizzle-orm/node-postgres' {
  export function drizzle(client: any, options?: any): any;
}

declare module 'drizzle-orm' {
  export const sql: any;
}

// Add declarations for any other missing modules here 