import { ArrowLeft, CalendarDays, Crown, FileCode2, Swords, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { syncAuthenticatedUser } from "@/lib/sync-auth-user";
import { getCategoryBySlug } from "@/lib/categories";
import { SiteNavbar } from "@/app/ui/site-navbar";

import CopyMarkdownButton from "./copy-markdown-button";

type PlanDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function codeBlockLanguage(className?: string) {
  if (!className) return "text";
  return className.replace("language-", "") || "text";
}

export async function generateMetadata({ params }: PlanDetailPageProps) {
  const { id } = await params;
  const plan = await db.plan.findFirst({
    where: { id, status: "accepted" },
    select: { title: true, category: true },
  });

  if (!plan) return { title: "Plan Not Found" };

  const cat = getCategoryBySlug(plan.category);
  return {
    title: `${plan.title} | ${cat?.shortName ?? plan.category}`,
    description: `Champion plan for ${cat?.name ?? plan.category}`,
  };
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/plan/${id}`)}`);
  }

  await syncAuthenticatedUser(session.user);

  const plan = await db.plan.findFirst({
    where: { id, status: "accepted" },
    select: {
      id: true,
      title: true,
      category: true,
      content: true,
      score: true,
      version: true,
      createdAt: true,
      author: {
        select: { avatarUrl: true, username: true },
      },
    },
  });

  if (!plan) notFound();

  const category = getCategoryBySlug(plan.category);
  const authorUsername = plan.author.username ?? "unknown";
  const authorAvatar = plan.author.avatarUrl ??
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(authorUsername)}`;
  const CategoryIcon = category?.icon;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-subtle)" }}>
      <SiteNavbar
        current="plan"
        user={{
          avatarUrl: session.user.avatarUrl,
          name: session.user.name ?? session.user.username,
          username: session.user.username,
        }}
      />

      <div className="mx-auto max-w-5xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <header className="card overflow-hidden">
            <div className="px-5 py-3 sm:px-6" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
                style={{ color: "var(--text-secondary)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to registry
              </Link>
            </div>

            <div className="space-y-5 px-5 py-6 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                {CategoryIcon ? (
                  <span className="badge badge-brand">
                    <CategoryIcon className="h-3.5 w-3.5" />
                    {category?.shortName}
                  </span>
                ) : null}
                <span className="badge badge-warning">
                  <Crown className="h-3.5 w-3.5" />
                  Champion · v{plan.version}
                </span>
              </div>

              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <h1
                    className="text-xl font-bold tracking-tight leading-tight sm:text-2xl lg:text-3xl"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {plan.title}
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    The current champion plan for{" "}
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {category?.name ?? plan.category}
                    </span>.
                    Think you can do better?
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:flex-col">
                  <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-muted)" }}>
                    <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--text-tertiary)" }}>Score</div>
                    <div className="mt-1 text-xl font-bold" style={{ color: "var(--brand-solid)" }}>
                      {plan.score ?? "N/A"}<span className="text-sm font-normal" style={{ color: "var(--text-tertiary)" }}>/100</span>
                    </div>
                  </div>
                  <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-muted)" }}>
                    <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--text-tertiary)" }}>Author</div>
                    <div className="mt-1 flex items-center gap-2 min-w-0 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      <UserCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                      <span className="truncate">@{authorUsername}</span>
                    </div>
                  </div>
                  <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-muted)" }}>
                    <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--text-tertiary)" }}>Published</div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      <CalendarDays className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
                      {plan.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: "1px solid var(--border-default)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={authorAvatar}
                    alt={authorUsername}
                    className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                    style={{ border: "1px solid var(--border-default)" }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>@{authorUsername}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Champion author</div>
                  </div>
                </div>

                <Link
                  href={`/submit?category=${plan.category}`}
                  className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm sm:w-auto"
                >
                  <Swords className="h-4 w-4" />
                  Challenge this plan
                </Link>
              </div>
            </div>
          </header>

          {/* Content */}
          <section className="card relative overflow-hidden">
            <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-5">
              <CopyMarkdownButton markdown={plan.content} />
            </div>

            <div className="px-4 py-3 pr-36 sm:px-6 sm:pr-40" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                <FileCode2 className="h-4 w-4" style={{ color: "var(--brand-solid)" }} />
                plan.md
              </div>
            </div>

            <div className="px-4 py-5 sm:px-6 sm:py-6">
              <article className="max-w-none">
                <ReactMarkdown
                  components={{
                    h1(props) {
                      return <h1 className="mt-8 text-2xl font-bold tracking-tight first:mt-0 sm:text-3xl" style={{ color: "var(--text-primary)" }} {...props} />;
                    },
                    h2(props) {
                      return <h2 className="mt-10 pb-3 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-default)" }} {...props} />;
                    },
                    h3(props) {
                      return <h3 className="mt-8 text-lg font-semibold" style={{ color: "var(--text-primary)" }} {...props} />;
                    },
                    p(props) {
                      return <p className="mt-4 text-[14px] leading-7" style={{ color: "var(--text-secondary)" }} {...props} />;
                    },
                    ul(props) {
                      return <ul className="mt-4 list-disc space-y-2 pl-5" style={{ color: "var(--text-secondary)" }} {...props} />;
                    },
                    ol(props) {
                      return <ol className="mt-4 list-decimal space-y-2 pl-5" style={{ color: "var(--text-secondary)" }} {...props} />;
                    },
                    li(props) {
                      return <li className="pl-1 text-[14px] leading-7" {...props} />;
                    },
                    blockquote(props) {
                      return <blockquote className="mt-6 rounded-lg px-4 py-3" style={{ borderLeft: "3px solid var(--brand-solid)", background: "var(--brand-subtle)", color: "var(--text-secondary)" }} {...props} />;
                    },
                    hr(props) {
                      return <hr className="my-8" style={{ borderColor: "var(--border-default)" }} {...props} />;
                    },
                    a(props) {
                      return <a className="font-medium underline underline-offset-4 transition" style={{ color: "var(--brand-solid)" }} {...props} />;
                    },
                    pre(props) {
                      const child = props.children;
                      const childProps = child && typeof child === "object" && "props" in child
                        ? (child.props as { className?: string })
                        : undefined;
                      return (
                        <pre className="mt-6 overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-default)" }}>
                          <div className="flex items-center justify-between px-4 py-2 text-[10px] uppercase tracking-[0.15em]" style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-default)" }}>
                            <span>{codeBlockLanguage(childProps?.className)}</span>
                          </div>
                          <div className="overflow-x-auto" style={{ background: "var(--bg-inset)" }}>{props.children}</div>
                        </pre>
                      );
                    },
                    code(props) {
                      const { className, children, ...rest } = props;
                      const isInline = !className && !String(children).includes("\n");
                      if (isInline) {
                        return <code className="rounded px-1.5 py-0.5 font-mono text-[13px]" style={{ background: "var(--bg-muted)", color: "var(--brand-solid)" }} {...rest}>{children}</code>;
                      }
                      return <code className="block min-w-max px-4 py-4 font-mono text-[12px] leading-6 sm:text-[13px]" style={{ color: "var(--text-primary)" }} {...rest}>{children}</code>;
                    },
                    table(props) {
                      return <div className="mt-6 overflow-x-auto"><table className="w-full border-collapse overflow-hidden rounded-xl text-left text-sm" style={{ border: "1px solid var(--border-default)" }} {...props} /></div>;
                    },
                    th(props) {
                      return <th className="px-4 py-3 font-semibold" style={{ background: "var(--bg-muted)", color: "var(--text-primary)", borderBottom: "1px solid var(--border-default)" }} {...props} />;
                    },
                    td(props) {
                      return <td className="px-4 py-3" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-subtle)" }} {...props} />;
                    },
                  }}
                >
                  {plan.content}
                </ReactMarkdown>
              </article>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
