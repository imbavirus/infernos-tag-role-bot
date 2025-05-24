/**
 * @file prisma.ts
 * @description Prisma client initialization and configuration
 * @module lib/prisma
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Global Prisma client instance
 * @type {PrismaClient}
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 