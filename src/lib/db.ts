import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  recallPrisma?: PrismaClient;
};
export function getDb() {
  if (!process.env.DATABASE_URL)
    throw new Error("The database has not been configured.");
  if (!globalForPrisma.recallPrisma) {
    globalForPrisma.recallPrisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
    });
  }
  return globalForPrisma.recallPrisma;
}
