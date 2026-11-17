"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Clapperboard, Lock, Mail, ShieldCheck } from "lucide-react";
import { loginAction, type LoginState } from "@/app/admin/actions/auth";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );
  const error = state.error || initialError;

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold text-black shadow-[0_12px_40px_-10px_rgba(242,200,107,0.8)]">
          <Clapperboard size={22} strokeWidth={2.4} />
        </span>
        <span className="display text-[30px] tracking-[0.08em]">CINEWOOD</span>
      </Link>

      <div className="rounded-3xl border border-white/10 bg-panel/80 p-7 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-8">
        <div className="mb-6">
          <span className="badge mb-3 border-gold/30 bg-gold/10 text-gold">
            <ShieldCheck size={12} /> Admin access
          </span>
          <h1 className="display text-4xl tracking-[0.04em]">Welcome back</h1>
          <p className="mt-2 text-sm text-white/45">
            Sign in to manage the library, categories and sources.
          </p>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error === "auth"
              ? "Please sign in to continue."
              : error === "not_admin"
                ? "This account does not have admin access."
                : error}
          </p>
        ) : null}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@cinewood.local"
                className="input h-12 pl-11"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="input h-12 pl-11"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="btn-gold h-12 w-full !py-3"
          >
            {pending ? "Signing in…" : "Sign in to dashboard"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-white/30">
        Protected area. Sessions are secured by Supabase Auth.
      </p>
    </div>
  );
}
