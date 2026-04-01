import { db } from "@/lib/db";

type SyncAuthenticatedUserInput = {
  id?: string | null;
  email?: string | null;
  githubId?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  name?: string | null;
};

export async function syncAuthenticatedUser(user: SyncAuthenticatedUserInput | null | undefined) {
  if (!user?.githubId) {
    return null;
  }

  const lookupClauses: Array<Record<string, string>> = [{ githubId: user.githubId }];

  if (user.id) {
    lookupClauses.push({ id: user.id });
  }

  if (user.email) {
    lookupClauses.push({ email: user.email });
  }

  const identityData = {
    avatarUrl: user.avatarUrl ?? user.image ?? undefined,
    githubId: user.githubId,
    image: user.avatarUrl ?? user.image ?? undefined,
    name: user.username ?? user.name ?? undefined,
    username: user.username ?? user.name ?? undefined,
  };

  if (lookupClauses.length > 0) {
    const existingUser = await db.user.findFirst({
      where: {
        OR: lookupClauses,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return db.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          ...identityData,
          email: user.email ?? undefined,
        },
      });
    }
  }

  return db.user.create({
    data: {
      ...identityData,
      email: user.email ?? undefined,
    },
  });
}
