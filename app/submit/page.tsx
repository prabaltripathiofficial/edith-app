import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { syncAuthenticatedUser } from "@/lib/sync-auth-user";

import SubmitPortal from "./submit-portal";

type SubmitPageProps = {
  searchParams: Promise<{
    category?: string | string[];
  }>;
};

export const metadata = {
  title: "Submit Plan",
  description: "Submit a tech-stack agnostic execution plan to challenge the current champion.",
};

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/submit")}`);
  }

  await syncAuthenticatedUser(session.user);

  const resolvedSearchParams = await searchParams;
  const initialCategory = Array.isArray(resolvedSearchParams.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams.category;

  // Fetch all current champions for the champion comparison bar
  const championPlans = await db.plan.findMany({
    where: {
      status: "accepted",
    },
    select: {
      category: true,
      title: true,
      score: true,
      author: {
        select: {
          username: true,
        },
      },
    },
  });

  const champions: Record<string, { title: string; score: number; authorUsername: string }> = {};
  for (const plan of championPlans) {
    champions[plan.category] = {
      title: plan.title,
      score: plan.score ?? 0,
      authorUsername: plan.author.username ?? "unknown",
    };
  }

  return (
    <SubmitPortal
      user={{
        avatarUrl: session.user.avatarUrl,
        name: session.user.name ?? session.user.username,
        username: session.user.username,
      }}
      champions={champions}
      initialCategory={initialCategory}
    />
  );
}
