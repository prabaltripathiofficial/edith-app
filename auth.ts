import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import authConfig from "./auth.config";
import { db } from "@/lib/db";
import { syncAuthenticatedUser } from "@/lib/sync-auth-user";

type GitHubProfile = {
  avatar_url?: string | null;
  id?: number | null;
  login?: string | null;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db as never),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (!account || account.provider !== "github" || !account.providerAccountId) {
        return true;
      }

      const githubProfile = profile as GitHubProfile | undefined;

      try {
        // Check if an Account record already exists for this provider + providerAccountId
        const existingAccount = await db.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          select: {
            userId: true,
          },
        });

        if (!existingAccount) {
          // No Account row yet — look for an existing User by githubId or email
          const matchClauses: Array<Record<string, string>> = [
            {
              githubId: account.providerAccountId,
            },
          ];

          if (user.email) {
            matchClauses.push({
              email: user.email,
            });
          }

          const existingUser = await db.user.findFirst({
            where: {
              OR: matchClauses,
            },
            select: {
              id: true,
            },
          });

          if (existingUser) {
            // Link the existing User to a new Account row
            await db.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token ?? undefined,
                access_token: account.access_token ?? undefined,
                expires_at: account.expires_at ?? undefined,
                token_type: account.token_type ?? undefined,
                scope: account.scope ?? undefined,
                id_token: account.id_token ?? undefined,
                session_state:
                  typeof account.session_state === "string" ? account.session_state : undefined,
              },
            });

            // Update the user profile with latest GitHub data
            await db.user.update({
              where: {
                id: existingUser.id,
              },
              data: {
                avatarUrl: githubProfile?.avatar_url ?? user.image ?? undefined,
                githubId: account.providerAccountId,
                image: githubProfile?.avatar_url ?? user.image ?? undefined,
                name: githubProfile?.login ?? user.name ?? undefined,
                username: githubProfile?.login ?? undefined,
              },
            });

            // Return true — the adapter won't create a duplicate User because
            // the Account now exists and points to the right user.
            return true;
          }
        }

        // Sync user data (create or update) regardless of whether account/user already existed
        await syncAuthenticatedUser({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          githubId: account.providerAccountId,
          username: githubProfile?.login ?? null,
          avatarUrl: githubProfile?.avatar_url ?? user.image ?? null,
        });
      } catch (error: unknown) {
        console.error("[auth] Failed to sync user during sign-in:", error);
      }

      return true;
    },
  },
});
