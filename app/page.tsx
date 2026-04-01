import { ArrowUpRight, Crown, FileCode2, Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { syncAuthenticatedUser } from "@/lib/sync-auth-user";
import { CATEGORIES } from "@/lib/categories";
import { SiteNavbar } from "@/app/ui/site-navbar";

export const metadata = {
  title: "Registry",
  description: "Browse the EDITH plan registry — one champion plan per category.",
};

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2F");
  }

  await syncAuthenticatedUser(session.user);

  const championPlans = await db.plan.findMany({
    where: { status: "accepted" },
    select: {
      id: true,
      title: true,
      category: true,
      score: true,
      version: true,
      createdAt: true,
      author: {
        select: {
          avatarUrl: true,
          username: true,
        },
      },
    },
  });

  const championMap = new Map(
    championPlans.map((plan) => [plan.category, plan]),
  );

  const totalChampions = championPlans.length;
  const totalCategories = CATEGORIES.length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-subtle)" }}>
      <SiteNavbar
        current="dashboard"
        user={{
          avatarUrl: session.user.avatarUrl,
          name: session.user.name ?? session.user.username,
          username: session.user.username,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="mb-10 animate-fade-in">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="badge badge-brand mb-4">
                <Trophy className="h-3.5 w-3.5" />
                Plan Registry
              </div>
              <h1
                className="text-3xl font-bold tracking-tight sm:text-4xl"
                style={{ color: "var(--text-primary)" }}
              >
                One champion plan{" "}
                <span className="text-gradient">per category</span>
              </h1>
              <p
                className="mt-3 max-w-xl text-base leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Tech-stack agnostic execution plans, AI-evaluated and ranked.
                Submit a better plan to dethrone the current champion.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-3">
              <div className="card rounded-2xl px-5 py-4">
                <div
                  className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Champions
                </div>
                <div
                  className="mt-1.5 text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {totalChampions}
                  <span
                    className="text-sm font-normal"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    /{totalCategories}
                  </span>
                </div>
              </div>
              <div className="card rounded-2xl px-5 py-4">
                <div
                  className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Categories
                </div>
                <div
                  className="mt-1.5 text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {totalCategories}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Category grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((category, index) => {
            const champion = championMap.get(category.slug);
            const IconComponent = category.icon;

            return (
              <div
                key={category.slug}
                className="animate-grid-item"
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                {champion ? (
                  <Link
                    href={`/plan/${champion.id}`}
                    className="card card-interactive group relative flex h-full flex-col overflow-hidden p-5"
                  >
                    <div className="absolute right-3 top-3">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full"
                        style={{ background: "var(--warning-bg)", color: "var(--warning)" }}
                      >
                        <Crown className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: "var(--brand-subtle)", color: "var(--brand-solid)" }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div
                          className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {category.shortName}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-bold"
                            style={{ color: "var(--brand-solid)" }}
                          >
                            {champion.score}/100
                          </span>
                          <span
                            className="text-[10px]"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            v{champion.version}
                          </span>
                        </div>
                      </div>
                    </div>

                    <h3
                      className="mt-4 line-clamp-2 text-sm font-semibold leading-snug"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {champion.title}
                    </h3>

                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2">
                        {champion.author.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={champion.author.avatarUrl}
                            alt={champion.author.username ?? ""}
                            className="h-5 w-5 rounded-full"
                            style={{ border: "1px solid var(--border-default)" }}
                          />
                        ) : null}
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          @{champion.author.username ?? "unknown"}
                        </span>
                      </div>
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    </div>
                  </Link>
                ) : (
                  <Link
                    href={`/submit?category=${category.slug}`}
                    className="card-ghost group flex h-full flex-col p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed"
                        style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div
                        className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {category.shortName}
                      </div>
                    </div>

                    <p
                      className="mt-4 text-[12px] leading-relaxed"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {category.description}
                    </p>

                    <div
                      className="mt-auto flex items-center gap-2 pt-4 text-[12px] font-medium transition-colors group-hover:text-[var(--brand-solid)]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Be the first champion
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {totalChampions === 0 ? (
          <div
            className="mt-8 rounded-2xl border border-dashed p-10 text-center animate-fade-in"
            style={{ borderColor: "var(--border-default)", background: "var(--bg-elevated)" }}
          >
            <Trophy className="mx-auto h-10 w-10" style={{ color: "var(--text-tertiary)" }} />
            <h3
              className="mt-4 text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              No champions yet
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              The registry is empty. Be the first to submit a plan and claim a category.
            </p>
            <Link href="/submit" className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-3 text-sm">
              <FileCode2 className="h-4 w-4" />
              Submit a plan
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
