import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./client-db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  trustedOrigins: [
    "http://localhost:3001",
    "http://localhost:3000",
    "https://quickpass-next.vercel.app",
    "https://quickpass-next-admin.vercel.app",
  ],
});
