import { PrismaClient } from '@prisma/client';
import { log } from '../server/vite';

declare global {
  var prisma: PrismaClient | undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable must be defined');
}

export const prisma = global.prisma || new PrismaClient({
  log: ['error', 'warn', 'info', 'query'],
  datasourceUrl: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    log('Query:', e.query);
    log('Duration:', e.duration + 'ms');
  });

  prisma.$on('error', (e: any) => {
    console.error('Prisma Error:', e.message);
  });

  prisma.$on('warn', (e: any) => {
    console.warn('Prisma Warning:', e.message);
  });
}

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;