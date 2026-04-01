import { Compass, FileSearch } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_26%),linear-gradient(180deg,_#09090b_0%,_#0f1115_50%,_#09090b_100%)] px-4 text-zinc-100">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950/85 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
          <FileSearch className="h-3.5 w-3.5 text-cyan-300" />
          Resource Not Found
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-50">
          The requested EDITH resource does not exist
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
          The page, plan, or route you requested could not be resolved. It may have been
          removed, renamed, or never published.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
          >
            <Compass className="h-4 w-4" />
            Back to dashboard
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
          >
            Submit a plan
          </Link>
        </div>
      </div>
    </div>
  );
}
