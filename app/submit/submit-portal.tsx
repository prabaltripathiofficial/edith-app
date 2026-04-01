"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Crown,
  FileCode2,
  LoaderCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteNavbar } from "@/app/ui/site-navbar";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";

const loadingStages = [
  "Parsing plan structure...",
  "Running static analysis...",
  "Evaluating AI constraints...",
  "Checking category alignment...",
  "Comparing against champion...",
  "Scoring enterprise readiness...",
] as const;

type EvaluationResult = {
  score: number;
  categoryMatch: boolean;
  constraintFeedback: string;
  generalFeedback: string;
  championScore?: number;
  isNewChampion?: boolean;
};

type ChampionInfo = {
  title: string;
  score: number;
  authorUsername: string;
};

type SubmitPortalProps = {
  user: {
    avatarUrl: string;
    name: string;
    username: string;
  };
  champions: Record<string, ChampionInfo>;
  initialCategory?: string;
};

export default function SubmitPortal({ user, champions, initialCategory }: SubmitPortalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategorySlug>(
    (initialCategory && CATEGORIES.some((c) => c.slug === initialCategory)
      ? initialCategory
      : CATEGORIES[0].slug) as CategorySlug,
  );
  const [markdown, setMarkdown] = useState(`# Execution Plan

## Objective
- Define the problem, the target user workflow, and the success condition.
- Keep this tech-stack agnostic — describe principles, not specific tools.

## Constraints
- List model limits, safety constraints, and non-goals.

## Delivery Steps
1. Gather inputs and validate assumptions.
2. Execute work in deterministic stages.
3. Add rollback and verification criteria.

## Edge Cases
- Describe failure paths and fallback behavior.

## Verification Checklist
- How do you confirm the plan was executed correctly?
`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentChampion = champions[category] ?? null;
  const selectedCategory = CATEGORIES.find((c) => c.slug === category);

  useEffect(() => {
    if (!isSubmitting) {
      setLoadingStage(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setLoadingStage((current) => Math.min(current + 1, loadingStages.length - 1));
    }, 1400);

    return () => window.clearInterval(intervalId);
  }, [isSubmitting]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, markdown }),
      });

      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "The evaluation request failed.";
        setError(message);
        toast.error(message);
        return;
      }

      setResult(payload as EvaluationResult);
      const typedResult = payload as EvaluationResult;
      if (typedResult.isNewChampion) {
        toast.success("Your plan is the new champion! 🏆");
      }
    } catch {
      const message = "Request failed. Check your network and try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isAccepted = Boolean(result && result.isNewChampion);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-subtle)" }}>
      <SiteNavbar current="submit" user={user} />

      <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="badge badge-brand mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Submission Portal
          </div>
          <h1
            className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl"
            style={{ color: "var(--text-primary)" }}
          >
            Challenge the champion
          </h1>
          <p
            className="mt-2 max-w-xl text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Write a tech-stack agnostic plan.md. If your score beats the current champion,
            you take the crown.
          </p>
        </header>

        <main className="grid flex-1 gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.95fr)]">
          {/* Editor */}
          <section className="card p-5 sm:p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <label className="space-y-2">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Title
                  </span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Zero-Trust API Gateway with Progressive Rollout"
                    className="input w-full px-4 py-3 text-sm"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Category
                  </span>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CategorySlug)}
                      className="input w-full appearance-none px-4 py-3 pr-10 text-sm"
                    >
                      {CATEGORIES.map((option) => (
                        <option key={option.slug} value={option.slug}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <ArrowRight
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                  </div>
                </label>
              </div>

              {/* Champion bar */}
              {currentChampion ? (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "var(--warning-bg)" }}
                >
                  <Crown className="h-4 w-4 shrink-0" style={{ color: "var(--warning)" }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--warning)" }}>
                      Score to beat: {currentChampion.score}
                    </div>
                    <div className="mt-0.5 truncate text-sm" style={{ color: "var(--text-secondary)" }}>
                      {currentChampion.title}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "var(--brand-subtle)" }}
                >
                  <Trophy className="h-4 w-4 shrink-0" style={{ color: "var(--brand-solid)" }} />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--brand-solid)" }}>
                      No champion yet — {selectedCategory?.shortName}
                    </div>
                    <div className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      Score 85+ to claim this category.
                    </div>
                  </div>
                </div>
              )}

              {/* Code editor */}
              <div
                className="overflow-hidden rounded-xl"
                style={{ border: "1px solid var(--border-default)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border-default)" }}
                >
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    <FileCode2 className="h-4 w-4" style={{ color: "var(--brand-solid)" }} />
                    plan.md
                  </div>
                  <div className="hidden items-center gap-2 text-xs sm:flex" style={{ color: "var(--text-tertiary)" }}>
                    <span>{markdown.split(/\s+/).filter(Boolean).length} words</span>
                    <span>·</span>
                    <span>{markdown.split("\n").length} lines</span>
                  </div>
                </div>

                <div className="grid min-h-[440px] grid-cols-[44px_minmax(0,1fr)]">
                  <div
                    className="px-2 py-4 text-right font-mono text-[11px] leading-7 select-none"
                    style={{
                      background: "var(--bg-muted)",
                      color: "var(--text-tertiary)",
                      borderRight: "1px solid var(--border-default)",
                    }}
                  >
                    {Array.from({ length: Math.max(markdown.split("\n").length, 12) }, (_, i) => (
                      <div key={i + 1}>{i + 1}</div>
                    ))}
                  </div>

                  <label className="relative flex">
                    <span className="sr-only">Plan markdown</span>
                    <textarea
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      spellCheck={false}
                      required
                      className="min-h-[440px] w-full resize-none px-4 py-4 font-mono text-[13px] leading-7 outline-none"
                      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
                      placeholder="Write a concrete, step-by-step execution plan..."
                    />
                  </label>
                </div>
              </div>

              <div
                className="flex flex-col gap-3 pt-4 lg:flex-row lg:items-center lg:justify-between"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
                  <Sparkles className="h-4 w-4" style={{ color: "var(--brand-solid)" }} />
                  Plans must be tech-stack agnostic.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      Submit for Review
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Sidebar */}
          <aside className="space-y-5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {/* Pipeline */}
            <section className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--text-tertiary)" }}>
                    Pipeline
                  </div>
                  <h2 className="mt-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Evaluation stages
                  </h2>
                </div>
                <LoaderCircle
                  className={`h-4 w-4 ${isSubmitting ? "animate-spin" : ""}`}
                  style={{ color: isSubmitting ? "var(--brand-solid)" : "var(--text-tertiary)" }}
                />
              </div>

              <div className="mt-4 space-y-2">
                {loadingStages.map((stage, index) => {
                  const state = !isSubmitting
                    ? "idle"
                    : index < loadingStage
                      ? "complete"
                      : index === loadingStage
                        ? "active"
                        : "pending";

                  return (
                    <div
                      key={stage}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] transition-all"
                      style={{
                        background:
                          state === "active" ? "var(--brand-subtle)" :
                          state === "complete" ? "var(--success-bg)" :
                          "transparent",
                        color:
                          state === "active" ? "var(--brand-solid)" :
                          state === "complete" ? "var(--success)" :
                          "var(--text-tertiary)",
                      }}
                    >
                      {state === "complete" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : state === "active" ? (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <div
                          className="h-3.5 w-3.5 rounded-full border"
                          style={{ borderColor: "var(--border-default)" }}
                        />
                      )}
                      <span>{stage}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Result */}
            <section className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--text-tertiary)" }}>
                    Result
                  </div>
                  <h2 className="mt-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Review outcome
                  </h2>
                </div>
                {result ? (
                  <span className={`badge ${isAccepted ? "badge-success" : "badge-warning"}`}>
                    {isAccepted ? "🏆 Champion" : "Not accepted"}
                  </span>
                ) : (
                  <span className="badge" style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)" }}>
                    Pending
                  </span>
                )}
              </div>

              {error ? (
                <div className="mt-4 rounded-lg p-3 text-[12px]" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                </div>
              ) : null}

              {result ? (
                <div className="mt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg p-3" style={{ background: "var(--bg-muted)" }}>
                      <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--text-tertiary)" }}>
                        Score
                      </div>
                      <div className="mt-2 flex items-end gap-1">
                        <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{result.score}</span>
                        <span className="pb-0.5 text-sm" style={{ color: "var(--text-tertiary)" }}>/100</span>
                      </div>
                      <div className="progress-bar mt-2">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${Math.max(4, result.score)}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg p-3" style={{ background: "var(--bg-muted)" }}>
                      <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--text-tertiary)" }}>
                        Category
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        {result.categoryMatch ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" style={{ color: "var(--success)" }} />
                            <span style={{ color: "var(--text-primary)" }}>Aligned</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4" style={{ color: "var(--warning)" }} />
                            <span style={{ color: "var(--text-primary)" }}>Misaligned</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg p-3" style={{ background: "var(--bg-muted)" }}>
                    <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--text-tertiary)" }}>
                      Constraint Feedback
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {result.constraintFeedback}
                    </p>
                  </div>

                  <div className="rounded-lg p-3" style={{ background: "var(--bg-muted)" }}>
                    <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--text-tertiary)" }}>
                      General Feedback
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {result.generalFeedback}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="mt-4 rounded-lg border border-dashed p-4 text-[12px]"
                  style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
                >
                  Submit a plan to see scoring, alignment, and feedback.
                </div>
              )}
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
