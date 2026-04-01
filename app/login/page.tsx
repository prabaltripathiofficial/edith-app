import { ArrowRight, GitBranch, Shield, Sparkles, Target, Zap } from "lucide-react";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { EdithLogo } from "@/app/ui/edith-logo";
import { CATEGORIES } from "@/lib/categories";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string | string[];
  }>;
};

function sanitizeCallbackUrl(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }

  return candidate;
}

export const metadata = {
  title: "Login",
  description: "Sign in with GitHub to access the EDITH workflow registry.",
};

const features = [
  {
    icon: Target,
    title: "AI-Evaluated Plans",
    description: "Every plan.md is scored by AI against enterprise-quality rubrics.",
  },
  {
    icon: Shield,
    title: "One Champion Per Category",
    description: "Only the highest-scoring plan survives. Beat it to take the crown.",
  },
  {
    icon: Zap,
    title: "Tech-Stack Agnostic",
    description: "Plans describe principles, not tools — usable with any stack.",
  },
  {
    icon: Sparkles,
    title: `${CATEGORIES.length} Categories`,
    description: "Architecture to resilience — every dimension of software engineering.",
  },
] as const;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const resolvedSearchParams = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(resolvedSearchParams.callbackUrl);

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  async function signInWithGitHub() {
    "use server";

    await signIn("github", { redirectTo: callbackUrl });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-subtle)" }}>
      {/* Vibrant gradient band at the top */}
      <div className="hero-gradient-vibrant h-[280px] sm:h-[360px]" />

      <div className="relative z-10 mx-auto -mt-[160px] max-w-lg px-5 pb-16 sm:-mt-[200px] sm:px-6">
        {/* Logo */}
        <div className="mb-10 flex justify-center animate-fade-in">
          <EdithLogo align="center" href="/login" size="large" />
        </div>

        {/* Main content — no box, clean and open */}
        <div className="animate-fade-in-scale" style={{ animationDelay: "0.1s" }}>
          <div className="text-center">
            <h1
              className="text-2xl font-bold tracking-tight leading-tight sm:text-4xl"
              style={{ color: "var(--text-primary)" }}
            >
              The plan registry for{" "}
              <span className="text-gradient">engineering teams</span>
            </h1>
            <p
              className="mx-auto mt-3 max-w-md text-sm leading-relaxed sm:mt-4 sm:text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              A curated, AI-evaluated collection of production-grade execution plans.
              One champion per category. Submit yours to compete.
            </p>
          </div>

          <form action={signInWithGitHub} className="mt-8 sm:mt-10">
            <button
              type="submit"
              className="btn-primary group flex w-full items-center justify-center gap-2.5 px-5 py-3.5 text-sm sm:gap-3 sm:px-6 sm:py-4 sm:text-base"
            >
              <GitBranch className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Continue with GitHub</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
            </button>
          </form>

          {/* Feature grid */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card rounded-2xl p-4 animate-fade-in"
                style={{ animationDelay: `${0.2 + index * 0.08}s` }}
              >
                <feature.icon className="h-5 w-5" style={{ color: "var(--brand-solid)" }} />
                <div
                  className="mt-2 text-[13px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feature.title}
                </div>
                <div
                  className="mt-1 text-[12px] leading-[1.5]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {feature.description}
                </div>
              </div>
            ))}
          </div>

          {/* Category pills */}
          <div
            className="mt-6 flex flex-wrap justify-center gap-1.5 sm:mt-8 sm:gap-2 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            {CATEGORIES.slice(0, 4).map((category) => (
              <span
                key={category.slug}
                className="badge text-[10px] sm:text-[11px]"
                style={{
                  background: "var(--bg-muted)",
                  color: "var(--text-tertiary)",
                }}
              >
                {category.shortName}
              </span>
            ))}
            <span
              className="badge text-[10px] sm:text-[11px]"
              style={{
                background: "var(--brand-subtle)",
                color: "var(--brand-solid)",
              }}
            >
              +{CATEGORIES.length - 4} more
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
