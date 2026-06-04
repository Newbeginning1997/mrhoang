"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ parent = false }: { parent?: boolean }) {
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
      className="btn-secondary w-full justify-center sm:w-auto"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {pending ? "Đang thoát..." : "Đăng xuất"}
    </button>
  );
}
