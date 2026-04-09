"use client";

import type { ChangeEvent } from "react";
import {
  Children,
  isValidElement,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useId,
  useState,
  useTransition,
} from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRightLeft,
  Braces,
  CheckCircle2,
  Clipboard,
  FileCode2,
  FileText,
  Link2,
  Monitor,
  MoonStar,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SunMedium,
  Table2,
  Tablet,
  Trash2,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { useTheme } from "@/app/ui/theme-provider";

type ToolId = "html" | "markdown" | "json" | "csv" | "url";
type DeviceMode = "desktop" | "tablet" | "mobile";

type ToolDefinition = {
  id: ToolId;
  label: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  accept: string;
  outputLabel: string;
};

type HtmlReport = {
  nodes: number;
  links: number;
  images: number;
  sections: number;
};

type MarkdownReport = {
  headings: { depth: number; text: string; slug: string }[];
  codeBlocks: number;
  bullets: number;
};

type JsonReport =
  | {
      valid: true;
      formatted: string;
      topLevelLabel: string;
      topLevelCount: number;
      arrays: number;
      maxDepth: number;
    }
  | {
      valid: false;
      error: string;
      formatted: string;
    };

type CsvReport =
  | {
      valid: true;
      delimiter: string;
      headers: string[];
      rows: string[][];
    }
  | {
      valid: false;
      error: string;
      delimiter: string;
      headers: string[];
      rows: string[][];
    };

type UrlReport =
  | {
      valid: true;
      href: string;
      origin: string;
      pathname: string;
      hash: string;
      params: Array<{ key: string; value: string }>;
      segments: string[];
    }
  | {
      valid: false;
      error: string;
      href: string;
      origin: string;
      pathname: string;
      hash: string;
      params: Array<{ key: string; value: string }>;
      segments: string[];
    };

const STORAGE_KEY = "friday-workspace";

const TOOLS: ToolDefinition[] = [
  {
    id: "html",
    label: "HTML to Visuals",
    eyebrow: "Experience Design",
    description: "Paste raw HTML and inspect the rendered result in a safe visual canvas.",
    icon: FileCode2,
    accept: ".html,.htm,.txt",
    outputLabel: "sanitized preview HTML",
  },
  {
    id: "markdown",
    label: "Markdown to Docs",
    eyebrow: "Documentation",
    description: "Turn markdown into a polished documentation surface with structure and hierarchy.",
    icon: FileText,
    accept: ".md,.markdown,.txt",
    outputLabel: "markdown source",
  },
  {
    id: "json",
    label: "JSON Formatter",
    eyebrow: "API Ops",
    description: "Validate payloads, prettify them, and expose data shape without switching tools.",
    icon: Braces,
    accept: ".json,.txt",
    outputLabel: "formatted JSON",
  },
  {
    id: "csv",
    label: "CSV Board",
    eyebrow: "Data Review",
    description: "Inspect CSV and TSV content as an actual table instead of raw comma soup.",
    icon: Table2,
    accept: ".csv,.tsv,.txt",
    outputLabel: "JSON rows",
  },
  {
    id: "url",
    label: "URL Inspector",
    eyebrow: "Debugging",
    description: "Break down routes, query params, and fragments for quick debugging and sharing.",
    icon: Link2,
    accept: ".txt",
    outputLabel: "URL breakdown",
  },
];

const DEFAULT_DRAFTS: Record<ToolId, string> = {
  html: `<!DOCTYPE html>
<html>
  <head>
    <style>
      :root {
        color-scheme: light;
        font-family: "Segoe UI", Arial, sans-serif;
      }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(19, 78, 74, 0.18), transparent 38%),
          linear-gradient(160deg, #f5efe6 0%, #f8fbfd 48%, #eef5f3 100%);
        color: #092532;
      }
      .shell {
        max-width: 920px;
        margin: 48px auto;
        padding: 28px;
      }
      .hero {
        display: grid;
        grid-template-columns: 1.3fr 0.9fr;
        gap: 20px;
        align-items: stretch;
      }
      .card {
        background: rgba(255, 255, 255, 0.78);
        border: 1px solid rgba(9, 37, 50, 0.08);
        border-radius: 28px;
        box-shadow: 0 24px 60px rgba(9, 37, 50, 0.08);
        backdrop-filter: blur(14px);
      }
      .hero-copy {
        padding: 32px;
      }
      .eyebrow {
        display: inline-flex;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.12);
        color: #0f766e;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 12px;
        font-size: 46px;
        line-height: 1.02;
      }
      p {
        margin: 0;
        color: #40616d;
        font-size: 17px;
        line-height: 1.7;
      }
      .metrics {
        display: grid;
        gap: 12px;
        margin-top: 26px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .metric {
        padding: 16px;
        border-radius: 20px;
        background: #ffffff;
        border: 1px solid rgba(9, 37, 50, 0.06);
      }
      .metric strong {
        display: block;
        font-size: 24px;
        margin-bottom: 8px;
      }
      .signal {
        padding: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background:
          linear-gradient(180deg, rgba(7, 89, 133, 0.94), rgba(8, 145, 178, 0.88)),
          #0f172a;
        color: #eff6ff;
      }
      .signal h2 {
        font-size: 18px;
        margin: 0 0 12px;
      }
      .signal ul {
        padding-left: 18px;
        margin: 0;
        line-height: 1.8;
      }
      .footer-band {
        margin-top: 20px;
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .footer-band .card {
        padding: 18px 20px;
      }
      @media (max-width: 820px) {
        .shell {
          margin: 20px auto;
          padding: 16px;
        }
        .hero,
        .footer-band,
        .metrics {
          grid-template-columns: 1fr;
        }
        h1 {
          font-size: 34px;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="hero">
        <article class="card hero-copy">
          <span class="eyebrow">Launch Readiness</span>
          <h1>Design a dashboard your execs can understand in one scan.</h1>
          <p>
            This sample shows the kind of marketing or product HTML teams paste every day
            while checking layout fidelity, spacing, and visual hierarchy.
          </p>
          <div class="metrics">
            <div class="metric"><strong>99.95%</strong> uptime target</div>
            <div class="metric"><strong>6</strong> workstreams aligned</div>
            <div class="metric"><strong>14 days</strong> to board review</div>
          </div>
        </article>
        <aside class="card signal">
          <div>
            <h2>Operations pulse</h2>
            <ul>
              <li>Migration runbook approved</li>
              <li>Customer success playbook synced</li>
              <li>Monitoring coverage expanded</li>
            </ul>
          </div>
          <p>Preview HTML instantly before it goes into an email builder, CMS, or landing page.</p>
        </aside>
      </section>
      <section class="footer-band">
        <div class="card">Revenue walkthrough assets</div>
        <div class="card">Release notes microsite block</div>
        <div class="card">Embedded docs announcement</div>
      </section>
    </div>
  </body>
</html>`,
  markdown: `# Friday Workspace Guide

Build once, review fast, and keep the source and output side by side.

## Why teams use it

- Paste draft HTML and see the actual visual composition immediately.
- Drop markdown from a repo or wiki and read it like real documentation.
- Keep a few daily debugging tools in the same workspace so context is not lost.

## Recommended flow

### 1. Bring in the raw asset

Use paste for quick work or import a local file when you are reviewing a handoff.

### 2. Validate the structure

Check headings, params, columns, or payload shape depending on the converter.

### 3. Share the cleaned result

Copy the output and send a tighter, more readable artifact to the next team.

## Example release note

> Payments export now supports scheduled batch delivery and signed webhook retries.

\`\`\`ts
export async function syncWorkspace() {
  return { status: "ready", reviewers: 4, blockers: 0 };
}
\`\`\`

## Daily concerns this app covers

- HTML previews for designers, marketers, and product teams
- Markdown docs for engineering and support handoffs
- JSON formatting for API work
- CSV review for ops and finance exports
- URL inspection for debugging and QA
`,
  json: `{
  "workspace": "friday",
  "environment": "production",
  "features": {
    "htmlPreview": true,
    "markdownDocs": true,
    "jsonFormatter": true,
    "csvViewer": true,
    "urlInspector": true
  },
  "teams": [
    "design systems",
    "developer experience",
    "operations"
  ],
  "sla": {
    "responseMsP95": 182,
    "errorBudgetRemaining": 97.4
  }
}`,
  csv: `team,owner,status,priority
Platform,Ava,In rollout,High
Docs,Noah,Ready,Medium
RevOps,Zara,Needs review,High
QA,Ivy,Blocked,Low`,
  url: `https://workspace.example.com/docs/release/v2?view=full&team=platform&ticket=SB-142#handoff`,
};

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: "w-full",
  tablet: "mx-auto w-full max-w-[780px]",
  mobile: "mx-auto w-full max-w-[420px]",
};

const DEVICE_LABELS: Record<DeviceMode, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

export function TransformationStudio() {
  const { theme, toggleTheme } = useTheme();
  const [activeTool, setActiveTool] = useState<ToolId>("html");
  const [drafts, setDrafts] = useState<Record<ToolId, string>>(DEFAULT_DRAFTS);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [isPending, startTransition] = useTransition();
  const fileInputId = useId();

  const activeDefinition = TOOLS.find((tool) => tool.id === activeTool) ?? TOOLS[0];
  const activeSource = drafts[activeTool];
  const deferredSource = useDeferredValue(activeSource);

  const persistWorkspace = useEffectEvent(
    (next: {
      drafts: Record<ToolId, string>;
      activeTool: ToolId;
      deviceMode: DeviceMode;
    }) => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        drafts?: Partial<Record<ToolId, string>>;
        activeTool?: ToolId;
        deviceMode?: DeviceMode;
      };

      if (parsed.drafts) {
        setDrafts((current) => ({ ...current, ...parsed.drafts }));
      }
      if (parsed.activeTool) {
        setActiveTool(parsed.activeTool);
      }
      if (parsed.deviceMode) {
        setDeviceMode(parsed.deviceMode);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    persistWorkspace({ drafts, activeTool, deviceMode });
  }, [activeTool, deviceMode, drafts]);

  const htmlPreview = sanitizeHtml(deferredSource);
  const htmlReport = inspectHtml(htmlPreview);
  const markdownReport = inspectMarkdown(deferredSource);
  const jsonReport = inspectJson(deferredSource);
  const csvReport = inspectCsv(deferredSource);
  const urlReport = inspectUrl(deferredSource);

  const headlineStats = getHeadlineStats(
    activeTool,
    htmlReport,
    markdownReport,
    jsonReport,
    csvReport,
    urlReport,
  );

  async function handleCopyOutput() {
    const exportText = getExportText(
      activeTool,
      htmlPreview,
      deferredSource,
      jsonReport,
      csvReport,
      urlReport,
    );

    try {
      await navigator.clipboard.writeText(exportText);
      toast.success(`Copied ${activeDefinition.outputLabel}.`);
    } catch {
      toast.error("Clipboard access failed in this environment.");
    }
  }

  function handleLoadSample() {
    startTransition(() => {
      setDrafts((current) => ({
        ...current,
        [activeTool]: DEFAULT_DRAFTS[activeTool],
      }));
    });
    toast.success(`${activeDefinition.label} sample loaded.`);
  }

  function handleClear() {
    startTransition(() => {
      setDrafts((current) => ({
        ...current,
        [activeTool]: "",
      }));
    });
  }

  function handleToolChange(nextTool: ToolId) {
    startTransition(() => {
      setActiveTool(nextTool);
    });
  }

  async function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      startTransition(() => {
        setDrafts((current) => ({
          ...current,
          [activeTool]: text,
        }));
      });
      toast.success(`${file.name} loaded into ${activeDefinition.label}.`);
    } catch {
      toast.error("The selected file could not be read.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(11,92,255,0.16),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(15,118,110,0.20),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.18),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[580px] bg-[linear-gradient(180deg,rgba(8,15,31,0.04),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 pb-10">
        <header className="rounded-[32px] border border-[var(--border-soft)] bg-[var(--surface-strong)]/88 p-5 shadow-[var(--shadow-panel)] backdrop-blur md:p-7">
          <div className="flex flex-col gap-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:items-start">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent-cyan)]" />
                  Friday
                </div>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-[var(--text-strong)] sm:text-5xl lg:text-6xl">
                  Friday turns rough drafts into presentation-ready surfaces.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
                  Paste HTML into a live visual canvas, read markdown like proper docs, and keep
                  the daily helper tools close by so reviews feel calmer, faster, and easier to trust.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-tint)]"
                  >
                    {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                    Toggle theme
                  </button>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-soft)]">
                    <ShieldCheck className="h-4 w-4 text-[var(--accent-emerald)]" />
                    Safe preview sandbox
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-soft)]">
                    <Sparkles className="h-4 w-4 text-[var(--accent-peach)]" />
                    One place for everyday conversions
                  </div>
                </div>
              </div>

              <HeroCompanionCard />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {headlineStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {stat.label}
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                    {stat.value}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{stat.detail}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {TOOLS.map((tool) => (
                <span
                  key={tool.id}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)]"
                >
                  <tool.icon className="h-3.5 w-3.5 text-[var(--accent-cyan)]" />
                  {tool.label}
                </span>
              ))}
            </div>

            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(255,255,255,0.2))] px-4 py-3 text-sm text-[var(--text-soft)]">
              Friday is built for the daily handoff loop: paste, preview, polish, copy, and move on.
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-strong)]/92 p-4 shadow-[var(--shadow-panel)] backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Friday Lanes
              </div>
              <div className="mt-4 space-y-3">
                {TOOLS.map((tool) => {
                  const active = tool.id === activeTool;

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleToolChange(tool.id)}
                      className={`w-full rounded-[24px] border p-4 text-left transition ${
                        active
                          ? "border-[var(--accent-cyan)] bg-[var(--surface-tint)] shadow-[var(--shadow-soft)]"
                          : "border-[var(--border-soft)] bg-[var(--surface-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-tint)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-contrast)] text-[var(--accent-cyan)]">
                            <tool.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                              {tool.eyebrow}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-[var(--text-strong)]">
                              {tool.label}
                            </div>
                          </div>
                        </div>
                        {active ? (
                          <CheckCircle2 className="h-5 w-5 text-[var(--accent-cyan)]" />
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                        {tool.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(7,89,133,0.94),rgba(15,118,110,0.9))] p-5 text-white shadow-[var(--shadow-panel)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Friday Promise
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
                Practical enough for operations, warm enough to actually enjoy using.
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/82">
                <li>Import files directly into the current lane.</li>
                <li>Keep drafts persisted locally between reviews.</li>
                <li>Copy cleaned output instead of raw noise.</li>
                <li>Preview HTML in a restricted iframe by default.</li>
              </ul>
            </div>
          </aside>

          <div className="rounded-[32px] border border-[var(--border-soft)] bg-[var(--surface-strong)]/94 p-4 shadow-[var(--shadow-panel)] backdrop-blur md:p-5">
            <div className="flex flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Active lane
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-contrast)] text-[var(--accent-cyan)]">
                      <activeDefinition.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                        {activeDefinition.label}
                      </h2>
                      <p className="text-sm text-[var(--text-soft)]">
                        {activeDefinition.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label
                    htmlFor={fileInputId}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-tint)]"
                  >
                    <Upload className="h-4 w-4" />
                    Import file
                  </label>
                  <input
                    id={fileInputId}
                    type="file"
                    accept={activeDefinition.accept}
                    className="hidden"
                    onChange={handleFileImport}
                  />
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-tint)]"
                  >
                    <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                    Load sample
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyOutput}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--surface-contrast)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-92"
                  >
                    <Clipboard className="h-4 w-4" />
                    Copy result
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-medium text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-strong)]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid gap-4 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <section className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--editor-bg)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        Source
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-soft)]">
                        Raw input stays editable while the output updates live.
                      </div>
                    </div>
                    <div className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-strong)] px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
                      {activeDefinition.accept.replaceAll(".", "").replaceAll(",", " / ")}
                    </div>
                  </div>

                  <textarea
                    value={activeSource}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [activeTool]: event.target.value,
                      }))
                    }
                    spellCheck={false}
                    className="mt-4 h-[560px] w-full resize-none rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-4 font-[family-name:var(--font-geist-mono)] text-sm leading-7 text-[var(--text-strong)] outline-none transition focus:border-[var(--accent-cyan)] focus:ring-4 focus:ring-[var(--ring-soft)]"
                    placeholder={`Paste ${activeDefinition.label.toLowerCase()} source here.`}
                  />
                </section>

                <section className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--preview-bg)] p-4">
                  {activeTool === "html" ? (
                    <HtmlPreview
                      source={htmlPreview}
                      report={htmlReport}
                      deviceMode={deviceMode}
                      setDeviceMode={setDeviceMode}
                    />
                  ) : null}

                  {activeTool === "markdown" ? (
                    <MarkdownPreview source={deferredSource} report={markdownReport} />
                  ) : null}

                  {activeTool === "json" ? (
                    <JsonPreview report={jsonReport} />
                  ) : null}

                  {activeTool === "csv" ? (
                    <CsvPreview report={csvReport} />
                  ) : null}

                  {activeTool === "url" ? (
                    <UrlPreview report={urlReport} />
                  ) : null}
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function HeroCompanionCard() {
  return (
    <div className="rounded-[30px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(8,47,73,0.96),rgba(18,87,108,0.94))] p-5 text-white shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Friday Desk
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            A friendlier workflow for messy inputs.
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
          <Sparkles className="h-6 w-6 text-[var(--accent-peach)]" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <HeroSignal
          label="09:10"
          title="HTML handoff loaded"
          detail="Marketing paste becomes a proper review surface in one shot."
        />
        <HeroSignal
          label="11:40"
          title="Markdown cleaned for docs"
          detail="Headings, outline, and code samples stay readable side by side."
        />
        <HeroSignal
          label="14:05"
          title="CSV and JSON checked"
          detail="Operational exports and payloads get fast visual sanity checks."
        />
      </div>
    </div>
  );
}

function HeroSignal({
  label,
  title,
  detail,
}: {
  label: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/12 bg-white/8 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-white">{title}</div>
      <p className="mt-1 text-sm leading-6 text-white/72">{detail}</p>
    </div>
  );
}

function HtmlPreview({
  source,
  report,
  deviceMode,
  setDeviceMode,
}: {
  source: string;
  report: HtmlReport;
  deviceMode: DeviceMode;
  setDeviceMode: (value: DeviceMode) => void;
}) {
  const devices: Array<{
    id: DeviceMode;
    label: string;
    icon: LucideIcon;
  }> = [
    { id: "desktop", label: "Desktop", icon: Monitor },
    { id: "tablet", label: "Tablet", icon: Tablet },
    { id: "mobile", label: "Mobile", icon: Smartphone },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Visual preview
          </div>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
            Rendered canvas
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
            HTML is rendered inside a restricted iframe so teams can validate layout fidelity
            without trusting the pasted markup.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {devices.map((device) => {
            const active = device.id === deviceMode;

            return (
              <button
                key={device.id}
                type="button"
                onClick={() => setDeviceMode(device.id)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "border-[var(--accent-cyan)] bg-[var(--surface-tint)] text-[var(--text-strong)]"
                    : "border-[var(--border-soft)] bg-[var(--surface-strong)] text-[var(--text-soft)] hover:border-[var(--border-strong)] hover:text-[var(--text-strong)]"
                }`}
              >
                <device.icon className="h-4 w-4" />
                {device.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <StatChip label="Nodes" value={String(report.nodes)} />
        <StatChip label="Sections" value={String(report.sections)} />
        <StatChip label="Links" value={String(report.links)} />
        <StatChip label="Images" value={String(report.images)} />
      </div>

      <div className="mt-4 flex-1 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-4">
        <div className={`rounded-[22px] border border-[var(--border-soft)] bg-white shadow-[var(--shadow-soft)] ${DEVICE_WIDTHS[deviceMode]}`}>
          <div className="flex items-center justify-between border-b border-zinc-200/70 px-4 py-3 text-xs font-medium text-zinc-500">
            <span>{DEVICE_LABELS[deviceMode]} viewport</span>
            <span>Friday preview sandbox</span>
          </div>
          <iframe
            title="HTML preview"
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={buildPreviewDocument(source)}
            className="h-[470px] w-full rounded-b-[22px] bg-white"
          />
        </div>
      </div>
    </div>
  );
}

function MarkdownPreview({
  source,
  report,
}: {
  source: string;
  report: MarkdownReport;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Documentation view
      </div>
      <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
            Proper docs on the right
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
            Outline and rendered content stay visible together so markdown is easier to review and
            share.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StatChip label="Headings" value={String(report.headings.length)} />
        <StatChip label="Code blocks" value={String(report.codeBlocks)} />
        <StatChip label="Bullets" value={String(report.bullets)} />
      </div>

      <div className="mt-4 grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <article className="doc-surface overflow-auto rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-6">
          <div className="doc-prose">
            <ReactMarkdown
              components={{
                h1: ({ children, ...props }) => (
                  <h1 id={slugify(readNodeText(children))} {...props}>
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2 id={slugify(readNodeText(children))} {...props}>
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 id={slugify(readNodeText(children))} {...props}>
                    {children}
                  </h3>
                ),
                h4: ({ children, ...props }) => (
                  <h4 id={slugify(readNodeText(children))} {...props}>
                    {children}
                  </h4>
                ),
                p: ({ ...props }) => <p {...props} />,
                ul: ({ ...props }) => <ul {...props} />,
                ol: ({ ...props }) => <ol {...props} />,
                li: ({ ...props }) => <li {...props} />,
                blockquote: ({ ...props }) => <blockquote {...props} />,
                code: ({ className, children, ...props }) =>
                  className ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="inline-code" {...props}>
                      {children}
                    </code>
                  ),
                pre: ({ ...props }) => <pre {...props} />,
              }}
            >
              {source || "# Empty document\n\nPaste markdown to render it here."}
            </ReactMarkdown>
          </div>
        </article>

        <aside className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Outline
          </div>
          <div className="mt-3 space-y-2">
            {report.headings.length > 0 ? (
              report.headings.map((heading) => (
                <a
                  key={heading.slug}
                  href={`#${heading.slug}`}
                  className="block rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-strong)]"
                  style={{ paddingLeft: `${heading.depth * 14}px` }}
                >
                  {heading.text}
                </a>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-[var(--border-soft)] px-4 py-5 text-sm leading-6 text-[var(--text-soft)]">
                Headings appear here once markdown includes structured sections.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function JsonPreview({ report }: { report: JsonReport }) {
  return (
    <div className="flex h-full flex-col">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Payload review
      </div>
      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
        Formatted and validated JSON
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        Quick validation for API payloads and configuration files without opening a separate
        formatter.
      </p>

      {report.valid ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatChip label={report.topLevelLabel} value={String(report.topLevelCount)} />
          <StatChip label="Arrays" value={String(report.arrays)} />
          <StatChip label="Depth" value={String(report.maxDepth)} />
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 dark:text-rose-100">
          {report.error}
        </div>
      )}

      <pre className="mt-4 flex-1 overflow-auto rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-5 font-[family-name:var(--font-geist-mono)] text-sm leading-7 text-[var(--text-strong)]">
        {report.formatted || "{ }"}
      </pre>
    </div>
  );
}

function CsvPreview({ report }: { report: CsvReport }) {
  return (
    <div className="flex h-full flex-col">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Data table
      </div>
      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
        Spreadsheet-style inspection
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        Rows and columns become readable instantly, which is usually all people want when exports
        land in chat or email.
      </p>

      {report.valid ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatChip label="Rows" value={String(report.rows.length)} />
          <StatChip label="Columns" value={String(report.headers.length)} />
          <StatChip label="Delimiter" value={report.delimiter === "\t" ? "Tab" : report.delimiter} />
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {report.error}
        </div>
      )}

      <div className="mt-4 flex-1 overflow-auto rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-strong)]">
        {report.headers.length > 0 ? (
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--surface-tint)]">
              <tr>
                {report.headers.map((header, index) => (
                  <th
                    key={`${header}-${index}`}
                    className="border-b border-[var(--border-soft)] px-4 py-3 font-semibold text-[var(--text-strong)]"
                  >
                    {header || `Column ${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="odd:bg-[var(--surface-muted)]/70">
                  {report.headers.map((_, cellIndex) => (
                    <td
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className="border-b border-[var(--border-soft)] px-4 py-3 text-[var(--text-soft)]"
                    >
                      {row[cellIndex] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex h-full min-h-[380px] items-center justify-center px-6 text-center text-sm leading-6 text-[var(--text-soft)]">
            Paste CSV or TSV content to build the table preview.
          </div>
        )}
      </div>
    </div>
  );
}

function UrlPreview({ report }: { report: UrlReport }) {
  return (
    <div className="flex h-full flex-col">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Route breakdown
      </div>
      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
        URL parsing without guesswork
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        Useful when product, QA, and engineering are all trying to reason about the same link.
      </p>

      {report.valid ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatChip label="Origin" value={trimValue(report.origin)} />
          <StatChip label="Segments" value={String(report.segments.length)} />
          <StatChip label="Params" value={String(report.params.length)} />
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {report.error}
        </div>
      )}

      <div className="mt-4 grid flex-1 gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Core parts
          </div>
          <dl className="mt-4 space-y-4">
            <InfoRow label="Full URL" value={report.href || "None"} />
            <InfoRow label="Origin" value={report.origin || "None"} />
            <InfoRow label="Pathname" value={report.pathname || "None"} />
            <InfoRow label="Hash" value={report.hash || "None"} />
          </dl>
        </div>

        <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Query params
          </div>
          <div className="mt-4 space-y-3">
            {report.params.length > 0 ? (
              report.params.map((param) => (
                <div
                  key={`${param.key}-${param.value}`}
                  className="rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {param.key}
                  </div>
                  <div className="mt-1 break-all text-sm text-[var(--text-strong)]">
                    {param.value || "Empty"}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[20px] border border-dashed border-[var(--border-soft)] px-4 py-5 text-sm leading-6 text-[var(--text-soft)]">
                Query parameters appear here once the URL includes them.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-[var(--text-strong)]">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm leading-6 text-[var(--text-strong)]">{value}</dd>
    </div>
  );
}

function getHeadlineStats(
  activeTool: ToolId,
  htmlReport: HtmlReport,
  markdownReport: MarkdownReport,
  jsonReport: JsonReport,
  csvReport: CsvReport,
  urlReport: UrlReport,
) {
  if (activeTool === "html") {
    return [
      {
        label: "Rendered nodes",
        value: String(htmlReport.nodes),
        detail: "A quick read on markup density before shipping the visual.",
      },
      {
        label: "Sections spotted",
        value: String(htmlReport.sections),
        detail: "Useful for scanning layout complexity and visual grouping.",
      },
      {
        label: "Safe mode",
        value: "Sandboxed",
        detail: "Preview is isolated from the app shell by default.",
      },
    ];
  }

  if (activeTool === "markdown") {
    return [
      {
        label: "Headings",
        value: String(markdownReport.headings.length),
        detail: "Makes structure visible before docs move into review.",
      },
      {
        label: "Code blocks",
        value: String(markdownReport.codeBlocks),
        detail: "Helpful for engineering handoffs and API docs.",
      },
      {
        label: "Review mode",
        value: "Split pane",
        detail: "Source stays editable while the doc view updates live.",
      },
    ];
  }

  if (activeTool === "json") {
    return jsonReport.valid
      ? [
          {
            label: jsonReport.topLevelLabel,
            value: String(jsonReport.topLevelCount),
            detail: "Top-level shape is visible immediately.",
          },
          {
            label: "Arrays",
            value: String(jsonReport.arrays),
            detail: "Useful for quickly judging nested collections.",
          },
          {
            label: "Depth",
            value: String(jsonReport.maxDepth),
            detail: "Signals how deeply nested the payload has become.",
          },
        ]
      : [
          {
            label: "Validation",
            value: "Failed",
            detail: "The current payload is not valid JSON yet.",
          },
          {
            label: "Output",
            value: "Raw",
            detail: "Keep editing on the left until the parser accepts it.",
          },
          {
            label: "Use case",
            value: "API Ops",
            detail: "Best for debugging payloads, configs, and feature flags.",
          },
        ];
  }

  if (activeTool === "csv") {
    return csvReport.valid
      ? [
          {
            label: "Rows",
            value: String(csvReport.rows.length),
            detail: "Export size at a glance without opening a spreadsheet.",
          },
          {
            label: "Columns",
            value: String(csvReport.headers.length),
            detail: "Checks shape before the data hits downstream tooling.",
          },
          {
            label: "Delimiter",
            value: csvReport.delimiter === "\t" ? "Tab" : csvReport.delimiter,
            detail: "Automatic delimiter detection avoids manual setup.",
          },
        ]
      : [
          {
            label: "Rows",
            value: "0",
            detail: "Paste a CSV or TSV payload to build the data table.",
          },
          {
            label: "Review",
            value: "Table",
            detail: "The output surface is optimized for scanning exported data.",
          },
          {
            label: "Use case",
            value: "Ops",
            detail: "Useful for finance, support, QA, and operations workflows.",
          },
        ];
  }

  return urlReport.valid
    ? [
        {
          label: "Origin",
          value: trimValue(urlReport.origin),
          detail: "Separates host context from route details instantly.",
        },
        {
          label: "Segments",
          value: String(urlReport.segments.length),
          detail: "Helpful when route nesting becomes hard to read.",
        },
        {
          label: "Params",
          value: String(urlReport.params.length),
          detail: "Query pairs are extracted into a readable checklist.",
        },
      ]
    : [
        {
          label: "Validation",
          value: "Failed",
          detail: "Paste a complete URL with protocol for full parsing.",
        },
        {
          label: "Use case",
          value: "QA",
          detail: "Ideal for debugging deep links and support tickets.",
        },
        {
          label: "Format",
          value: "URL",
          detail: "Works well for routes, campaign links, and handoff notes.",
        },
      ];
}

function getExportText(
  activeTool: ToolId,
  htmlPreview: string,
  markdownSource: string,
  jsonReport: JsonReport,
  csvReport: CsvReport,
  urlReport: UrlReport,
) {
  if (activeTool === "html") {
    return htmlPreview;
  }

  if (activeTool === "markdown") {
    return markdownSource;
  }

  if (activeTool === "json") {
    return jsonReport.valid ? jsonReport.formatted : jsonReport.formatted;
  }

  if (activeTool === "csv") {
    if (!csvReport.valid || csvReport.headers.length === 0) {
      return "";
    }

    return JSON.stringify(
      csvReport.rows.map((row) =>
        Object.fromEntries(csvReport.headers.map((header, index) => [header || `column_${index + 1}`, row[index] ?? ""])),
      ),
      null,
      2,
    );
  }

  if (!urlReport.valid) {
    return urlReport.href;
  }

  return JSON.stringify(
    {
      href: urlReport.href,
      origin: urlReport.origin,
      pathname: urlReport.pathname,
      hash: urlReport.hash,
      params: urlReport.params,
      segments: urlReport.segments,
    },
    null,
    2,
  );
}

function sanitizeHtml(input: string) {
  if (!input.trim()) {
    return "";
  }

  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z-]+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\son[a-z-]+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

function buildPreviewDocument(source: string) {
  if (!source.trim()) {
    return `<!DOCTYPE html>
<html>
  <body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#f8fafc;color:#475569;font-family:Arial,sans-serif;">
    <div style="max-width:420px;padding:24px;text-align:center;">
      <div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;font-weight:700;color:#0f766e;">Friday</div>
      <h1 style="font-size:28px;margin:18px 0 10px;color:#0f172a;">Preview waits here.</h1>
      <p style="margin:0;line-height:1.7;">Paste HTML on the left and the visual output will render in this canvas.</p>
    </div>
  </body>
</html>`;
  }

  return source.includes("<html")
    ? source
    : `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>${source}</body>
</html>`;
}

function inspectHtml(source: string): HtmlReport {
  if (!source.trim()) {
    return { nodes: 0, links: 0, images: 0, sections: 0 };
  }

  if (typeof DOMParser === "undefined") {
    return {
      nodes: (source.match(/<([a-z][^\s/>]*)/gi) ?? []).length,
      links: (source.match(/<a[\s>]/gi) ?? []).length,
      images: (source.match(/<img[\s>]/gi) ?? []).length,
      sections: (source.match(/<(section|article|header|footer|main)[\s>]/gi) ?? []).length,
    };
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(buildPreviewDocument(source), "text/html");

  return {
    nodes: documentNode.body.querySelectorAll("*").length,
    links: documentNode.body.querySelectorAll("a").length,
    images: documentNode.body.querySelectorAll("img").length,
    sections: documentNode.body.querySelectorAll("section, article, header, footer, main").length,
  };
}

function inspectMarkdown(source: string): MarkdownReport {
  const headings = source
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{1,6})\s+(.*)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      depth: match[1].length,
      text: stripMarkdownDecorators(match[2].trim()),
      slug: slugify(stripMarkdownDecorators(match[2].trim())),
    }));

  return {
    headings,
    codeBlocks: (source.match(/```/g) ?? []).length / 2,
    bullets: source
      .split(/\r?\n/)
      .filter((line) => /^(\s*[-*+]|\s*\d+\.)\s+/.test(line)).length,
  };
}

function inspectJson(source: string): JsonReport {
  if (!source.trim()) {
    return {
      valid: true,
      formatted: "{\n  \n}",
      topLevelLabel: "Top-level keys",
      topLevelCount: 0,
      arrays: 0,
      maxDepth: 1,
    };
  }

  try {
    const parsed = JSON.parse(source) as unknown;
    return {
      valid: true,
      formatted: JSON.stringify(parsed, null, 2),
      topLevelLabel: Array.isArray(parsed) ? "Top-level items" : "Top-level keys",
      topLevelCount: Array.isArray(parsed)
        ? parsed.length
        : typeof parsed === "object" && parsed !== null
          ? Object.keys(parsed).length
          : 1,
      arrays: countArrays(parsed),
      maxDepth: getMaxDepth(parsed),
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "JSON parsing failed.",
      formatted: source,
    };
  }
}

function inspectCsv(source: string): CsvReport {
  if (!source.trim()) {
    return { valid: true, delimiter: ",", headers: [], rows: [] };
  }

  const delimiter = detectDelimiter(source);
  const parsed = parseDelimited(source, delimiter);

  if (!parsed.valid) {
    return {
      valid: false,
      error: parsed.error,
      delimiter,
      headers: [],
      rows: [],
    };
  }

  const [headerRow = [], ...rows] = parsed.rows;
  return {
    valid: true,
    delimiter,
    headers: headerRow,
    rows,
  };
}

function inspectUrl(source: string): UrlReport {
  if (!source.trim()) {
    return {
      valid: false,
      error: "Paste a URL to inspect it.",
      href: "",
      origin: "",
      pathname: "",
      hash: "",
      params: [],
      segments: [],
    };
  }

  try {
    const parsed = new URL(source.trim());
    return {
      valid: true,
      href: parsed.href,
      origin: parsed.origin,
      pathname: parsed.pathname,
      hash: parsed.hash,
      params: Array.from(parsed.searchParams.entries()).map(([key, value]) => ({
        key,
        value,
      })),
      segments: parsed.pathname.split("/").filter(Boolean),
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "URL parsing failed.",
      href: source,
      origin: "",
      pathname: "",
      hash: "",
      params: [],
      segments: [],
    };
  }
}

function stripMarkdownDecorators(value: string) {
  return value.replace(/[`*_~[\]]/g, "").replace(/\((.*?)\)/g, "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readNodeText(node: React.ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement<{ children?: React.ReactNode }>(child)) {
        return readNodeText(child.props.children);
      }

      return "";
    })
    .join(" ")
    .trim();
}

function countArrays(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce((count, item) => count + countArrays(item), 1);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).reduce((count, item) => count + countArrays(item), 0);
  }

  return 0;
}

function getMaxDepth(value: unknown, depth = 1): number {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return depth;
    }
    return Math.max(...value.map((item) => getMaxDepth(item, depth + 1)));
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.values(value);
    if (entries.length === 0) {
      return depth;
    }
    return Math.max(...entries.map((item) => getMaxDepth(item, depth + 1)));
  }

  return depth;
}

function detectDelimiter(source: string) {
  const [firstLine = ""] = source.split(/\r?\n/).filter(Boolean);
  const candidates = [",", ";", "\t", "|"];

  return (
    candidates
      .map((candidate) => ({
        candidate,
        count: firstLine.split(candidate).length,
      }))
      .sort((left, right) => right.count - left.count)[0]?.candidate ?? ","
  );
}

function parseDelimited(source: string, delimiter: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        currentValue += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && char === delimiter) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if (!insideQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      currentRow.push(currentValue);
      currentValue = "";
      rows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentValue += char;
  }

  if (insideQuotes) {
    return {
      valid: false as const,
      error: "Quoted values are not closed correctly.",
      rows: [],
    };
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return {
    valid: true as const,
    rows: rows.filter((row) => row.some((cell) => cell.trim().length > 0)),
  };
}

function trimValue(value: string, length = 14) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1)}…`;
}
