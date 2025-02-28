
import { prisma } from '../lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  try {
    console.log('Generating Prisma Client...');
    await execAsync('npx prisma generate');
    
    console.log('Validating database connection...');
    try {
      await prisma.$connect();
      console.log('Database connection successful!');
    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
