import Link from "next/link";

type EdithLogoProps = {
  align?: "left" | "center";
  href?: string;
  size?: "default" | "large";
};

export function EdithLogo({
  align = "left",
  href = "/",
  size = "default",
}: EdithLogoProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";
  const titleSize = size === "large" ? "text-4xl sm:text-5xl" : "text-lg sm:text-xl";
  const subtitleSize = size === "large" ? "text-[11px] tracking-[0.3em]" : "text-[9px] tracking-[0.22em]";

  return (
    <Link href={href} className={`group inline-flex flex-col gap-1 ${alignment}`}>
      <span className="inline-flex items-center gap-2 font-mono uppercase" style={{ color: "var(--text-primary)" }}>
        <span className={`${titleSize} font-bold tracking-[0.35em]`}>
          EDITH
        </span>
        <span className="relative">
          <span className="absolute inset-[-4px] rounded-full bg-[var(--brand-solid)] opacity-30 blur-md" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--brand-solid)] animate-dot-pulse" />
        </span>
      </span>
      <span
        className={`${subtitleSize} font-medium uppercase`}
        style={{ color: "var(--text-tertiary)" }}
      >
        Verified Agentic Workflows
      </span>
    </Link>
  );
}
