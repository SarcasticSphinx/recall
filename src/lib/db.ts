import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  recallPrisma?: PrismaClient;
  recallPrismaConstructor?: typeof PrismaClient;
};
export function getDb() {
  if (!process.env.DATABASE_URL)
    throw new Error("The database has not been configured.");
  // A regenerated Prisma client has a new constructor. Do not keep an older
  // model definition alive across Next.js development hot reloads.
  if (
    !globalForPrisma.recallPrisma ||
    globalForPrisma.recallPrismaConstructor !== PrismaClient
  ) {
    const previous = globalForPrisma.recallPrisma;
    globalForPrisma.recallPrisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
    });
    globalForPrisma.recallPrismaConstructor = PrismaClient;
    if (previous) void previous.$disconnect().catch(() => {});
  }
  return globalForPrisma.recallPrisma;
}
