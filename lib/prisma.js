// Instance unique de Prisma Client, réutilisée entre les requêtes en
// développement (évite d'épuiser les connexions PostgreSQL au rechargement).
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
