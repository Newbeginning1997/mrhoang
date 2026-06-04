"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({
  parent = false,
  compact = false
}: {
  parent?: boolean;
  compact?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace(parent ? "/parents" : "/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      aria-label={compact ? "Đăng xuất" : undefined}
      className={
        compact
          ? "btn-secondary h-10 w-10 shrink-0 px-0"
          : "btn-secondary w-full justify-center sm:w-auto"
      }
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {compact ? (
        <span className="sr-only">{pending ? "Đang thoát..." : "Đăng xuất"}</span>
      ) : (
        pending ? "Đang thoát..." : "Đăng xuất"
      )}
    </button>
  );
}
