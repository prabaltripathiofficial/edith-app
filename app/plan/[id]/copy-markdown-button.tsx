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
      className={`btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm ${
        copied ? "!border-[var(--success)] !text-[var(--success)]" : ""
      }`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied!" : "Copy for Agent"}
    </button>
  );
}
