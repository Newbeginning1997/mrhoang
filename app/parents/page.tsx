import Link from "next/link";
import { ArrowLeft, UsersRound } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/auth/login-form";

export default function ParentLoginPage({
  searchParams
}: {
  searchParams?: { next?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
        <div className="mb-7 flex items-start gap-4">
          <BrandLogo />
          <div className="min-w-0">
            <p className="label">Parent Portal</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">
              Phụ huynh đăng nhập
            </h1>
          </div>
        </div>
        <div className="mb-6 rounded-lg border border-lagoon/15 bg-lagoon/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lagoon ring-1 ring-lagoon/15">
              <UsersRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Theo dõi theo khối</p>
              <p className="mt-0.5 text-xs text-muted">Tài khoản phụ huynh dùng riêng cho khối 6-9.</p>
            </div>
          </div>
        </div>
        <LoginForm
          portal="parent"
          buttonLabel="Xem tiến độ học tập"
          nextPath={searchParams?.next}
        />
        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary/80"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Quay lại cổng học sinh và giáo viên
        </Link>
      </section>
    </main>
  );
}
