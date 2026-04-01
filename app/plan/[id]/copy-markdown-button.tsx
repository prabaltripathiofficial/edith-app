"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type CopyMarkdownButtonProps = {
  markdown: string;
};

export default function CopyMarkdownButton({ markdown }: CopyMarkdownButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success("Raw markdown copied for agent use.");

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Failed to copy markdown", error);
      toast.error("Failed to copy markdown.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-secondary inline-flex items-center gap-1.5 px-2.5 py-2 text-xs sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
        copied ? "!border-[var(--success)] !text-[var(--success)]" : ""
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
      <span className="hidden sm:inline">{copied ? "Copied!" : "Copy for Agent"}</span>
      <span className="sm:hidden">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

