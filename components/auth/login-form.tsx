"use client";

import { LockKeyhole, LogIn, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm({
  portal,
  buttonLabel,
  nextPath,
  supportText
}: {
  portal: "school" | "parent";
  buttonLabel: string;
  nextPath?: string | null;
  supportText?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
        portal
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Không thể đăng nhập.");
      setPending(false);
      return;
    }

    router.replace(nextPath && nextPath.startsWith("/") ? nextPath : payload.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-1">
        <span className="label">Tên đăng nhập / Username</span>
        <span className="relative block">
          <UserRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            name="username"
            autoComplete="username"
            className="field pl-9"
            placeholder={portal === "parent" ? "ph_khoi6" : "hs_nguyenvana_7a"}
            required
          />
        </span>
      </label>
      <label className="block space-y-1">
        <span className="label">Mật khẩu / Password</span>
        <span className="relative block">
          <LockKeyhole className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="field pl-9"
            required
          />
        </span>
      </label>
      {error ? (
        <p className="rounded-md border border-rose/15 bg-rose/5 px-3 py-2 text-sm font-medium text-rose">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        <LogIn className="h-4 w-4" aria-hidden />
        {pending ? "Đang đăng nhập..." : buttonLabel}
      </button>
      {supportText ? (
        <p className="text-center text-xs font-semibold text-muted">{supportText}</p>
      ) : null}
    </form>
  );
}
