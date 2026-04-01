import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

type GitHubProviderProfile = {
  avatar_url: string;
  email?: string | null;
  id: number;
  login: string;
  name?: string | null;
};

function sanitizeCallbackUrl(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    GitHub({
      profile(profile) {
        const githubProfile = profile as GitHubProviderProfile;

        return {
          id: String(githubProfile.id),
          name: githubProfile.name ?? githubProfile.login,
          email: githubProfile.email,
          image: githubProfile.avatar_url,
          githubId: String(githubProfile.id),
          username: githubProfile.login,
          avatarUrl: githubProfile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isAuthenticated = Boolean(auth?.user);
      const { pathname, search } = request.nextUrl;
      const isLoginRoute = pathname === "/login";

      if (!isAuthenticated && !isLoginRoute) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set(
          "callbackUrl",
          sanitizeCallbackUrl(`${pathname}${search}`),
        );
        return NextResponse.redirect(loginUrl);
      }

      if (isAuthenticated && isLoginRoute) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return true;
    },
    jwt({ token, user, account, profile }) {
      const githubProfile = profile as GitHubProviderProfile | undefined;
      const typedUser = user as
        | {
            id?: string;
            githubId?: string | null;
            username?: string | null;
            avatarUrl?: string | null;
            image?: string | null;
            name?: string | null;
          }
        | undefined;

      if (typedUser?.id) {
        token.sub = typedUser.id;
        token.id = typedUser.id;
      }

      if (typedUser?.githubId) {
        token.githubId = typedUser.githubId;
      } else if (account?.provider === "github" && account.providerAccountId) {
        token.githubId = account.providerAccountId;
      }

      if (typedUser?.username) {
        token.username = typedUser.username;
      } else if (githubProfile?.login) {
        token.username = githubProfile.login;
      }

      if (typedUser?.avatarUrl) {
        token.avatarUrl = typedUser.avatarUrl;
      } else if (typedUser?.image) {
        token.avatarUrl = typedUser.image;
      } else if (githubProfile?.avatar_url) {
        token.avatarUrl = githubProfile.avatar_url;
      }

      token.name =
        (typeof token.username === "string" && token.username) ||
        typedUser?.name ||
        token.name;
      token.picture =
        (typeof token.avatarUrl === "string" && token.avatarUrl) ||
        typedUser?.image ||
        token.picture;

      return token;
    },
    session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = typeof token.id === "string" ? token.id : token.sub ?? "";
      session.user.githubId = typeof token.githubId === "string" ? token.githubId : "";
      session.user.username =
        typeof token.username === "string" ? token.username : session.user.name ?? "";
      session.user.avatarUrl =
        typeof token.avatarUrl === "string" ? token.avatarUrl : session.user.image ?? "";
      session.user.name = session.user.username;
      session.user.image = session.user.avatarUrl;

      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
