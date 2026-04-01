"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("App route error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_26%),linear-gradient(180deg,_#09090b_0%,_#0f1115_50%,_#09090b_100%)] px-4 text-zinc-100">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950/85 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
          <AlertTriangle className="h-3.5 w-3.5" />
          Runtime Interruption
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-50">
          The workflow registry hit an unexpected fault
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
          The request did not complete successfully. This can happen if a backing service,
          database query, or runtime dependency becomes temporarily unavailable.
        </p>
        {error.digest ? (
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Error digest: {error.digest}
          </div>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
