"use client";

import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";

import { EdithLogo } from "./edith-logo";
import { useTheme } from "./theme-provider";

type SiteNavbarProps = {
  current?: "dashboard" | "submit" | "plan";
  user?: {
    avatarUrl?: string;
    name?: string;
    username: string;
  };
};

export function SiteNavbar({ current = "dashboard", user }: SiteNavbarProps) {
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  function linkClass(isActive: boolean) {
    return `rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-[var(--brand-subtle)] text-[var(--brand-solid)]"
        : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
    }`;
  }

  return (
    <nav className="nav-bar sticky top-0 z-50 mb-8">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <EdithLogo />

          {/* Desktop nav */}
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex items-center gap-1">
              <Link href="/" className={linkClass(current === "dashboard")}>
                Registry
              </Link>
              <Link href="/submit" className={linkClass(current === "submit")}>
                Submit Plan
              </Link>
            </div>

            <div className="mx-2 h-5 w-px" style={{ background: "var(--border-default)" }} />

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2.5 rounded-lg px-3 py-1.5"
                  style={{ background: "var(--bg-muted)" }}
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="h-7 w-7 rounded-full object-cover"
                      style={{ border: "1px solid var(--border-default)" }}
                    />
                  ) : (
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        background: "var(--brand-subtle)",
                        color: "var(--brand-solid)",
                      }}
                    >
                      {(user.name ?? user.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.name ?? user.username}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      void signOut({ redirectTo: "/login" });
                    });
                  }}
                  disabled={isPending}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: "var(--text-secondary)" }}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen ? (
          <div
            className="mt-3 flex flex-col gap-1 border-t pt-3 lg:hidden"
            style={{ borderColor: "var(--border-default)" }}
          >
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={linkClass(current === "dashboard")}
            >
              Registry
            </Link>
            <Link
              href="/submit"
              onClick={() => setMobileOpen(false)}
              className={linkClass(current === "submit")}
            >
              Submit Plan
            </Link>

            {user ? (
              <div
                className="mt-2 flex items-center justify-between border-t pt-3"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div className="flex items-center gap-2.5">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : null}
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    @{user.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      void signOut({ redirectTo: "/login" });
                    });
                  }}
                  disabled={isPending}
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {isPending ? "Signing out..." : "Log out"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
