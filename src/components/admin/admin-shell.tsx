"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChartColumn,
  ExternalLink,
  Film,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Server,
  Settings,
  Tags,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions/auth";
import { BrandLogo } from "@/components/site/brand-logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/movies", label: "Movies & Series", icon: Film },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/genres", label: "Genres", icon: Tags },
  { href: "/admin/sources", label: "Sources", icon: Server },
  { href: "/admin/reports", label: "Reports", icon: ChartColumn },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminShellProps {
  children: React.ReactNode;
  email: string;
  displayName: string;
}

export function AdminShell({ children, email, displayName }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5">
        <BrandLogo className="h-9" />
        <span className="ml-auto rounded-md border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gold">
          Admin
        </span>
      </Link>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-gold/10 text-gold"
                  : "text-white/55 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon size={17} />
              {item.label}
              {active ? (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={16} /> View website
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/50 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={16} /> Sign out
          </button>
        </form>

        <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="truncate text-xs font-bold text-white/75">
            {displayName || "Administrator"}
          </p>
          <p className="truncate text-[11px] text-white/35">{email}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#0a0c12] lg:block">
        {sidebar}
      </aside>

      <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-ink/85 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5"
          aria-label="Open admin menu"
        >
          <Menu size={18} />
        </button>
        <BrandLogo className="h-9" />
        <span className="ml-auto rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-gold">
          Admin
        </span>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close admin menu"
          />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-xs border-r border-white/10 bg-[#0a0c12]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
