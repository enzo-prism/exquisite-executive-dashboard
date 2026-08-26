"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview" },
  { href: "/leads", label: "ChatGPT Leads" },
] as const;

export function DashboardNav({ current }: { current: "overview" | "leads" }) {
  return (
    <nav aria-label="Dashboard sections" className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active =
          (current === "overview" && link.href === "/") ||
          (current === "leads" && link.href === "/leads");

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-teal-200 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
