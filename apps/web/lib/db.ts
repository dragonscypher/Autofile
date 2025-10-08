/**
 * Database connection singleton
 * 
 * This ensures we reuse the same Prisma Client instance across hot reloads in development,
 * preventing too many database connections.
 */

import { PrismaClient } from '@prisma/client';

// Fix DATABASE_URL if it's set to the wrong value (file:./dev.db)
// This can happen if a system environment variable overrides .env.local
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'file:./dev.db' || !process.env.DATABASE_URL.startsWith('postgresql://')) {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/autofile';
}

// Add type for the global prisma instance
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Create or reuse Prisma Client instance
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// In development, save the instance to prevent creating new clients on hot reload
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
