import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDb } from "./db";

export function isAuthConfigured() {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET,
  );
}
function createAuth(db: ReturnType<typeof getDb>) {
  return betterAuth({
    appName: "Recall",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    database: prismaAdapter(db, { provider: "postgresql" }),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;
let database: ReturnType<typeof getDb> | undefined;
export function getAuth() {
  if (!isAuthConfigured())
    throw new Error("Google sign-in is not configured yet.");
  const current = getDb();
  if (!instance || database !== current) {
    instance = createAuth(current);
    database = current;
  }
  return instance;
}
