import Link from "next/link";
import { ArrowRight, BookOpenCheck, GraduationCap, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage({
  searchParams
}: {
  searchParams?: { next?: string };
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-paper px-4 py-8 sm:py-10">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/classroom-login-bg.png')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-white/72 backdrop-blur-[2px]" aria-hidden />
      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-md overflow-hidden rounded-lg border border-white/70 bg-white/90 shadow-panel ring-1 ring-white/50 lg:max-w-6xl lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden bg-primary/95 px-6 py-8 text-white sm:px-10 lg:flex">
          <div className="grid min-h-[380px] w-full grid-rows-[1fr_auto]">
            <div className="flex flex-col items-center justify-center pb-8">
              <BrandLogo
                variant="full"
                size="xl"
                framed={false}
                className="mx-auto mb-8 drop-shadow-sm"
              />
              <p className="text-center text-xs font-bold uppercase tracking-wide text-white/70">
                English Class Portal
              </p>
              <h1 className="mx-auto mt-3 max-w-md text-center text-3xl font-bold tracking-normal sm:text-4xl">
                Lớp tiếng Anh Mr Hoàng
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-center text-base leading-7 text-white/78">
                Không gian học tập riêng cho giáo viên, học sinh và phụ huynh.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Teacher", icon: ShieldCheck, href: "/login?next=/admin" },
                { label: "Student", icon: GraduationCap, href: "/login?next=/student" },
                { label: "Progress", icon: BookOpenCheck, href: "/parents" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-lg border border-white/15 bg-white/10 p-3 transition hover:border-white/35 hover:bg-white/15 focus-ring"
                  >
                    <Icon className="h-5 w-5 text-white" aria-hidden />
                    <p className="mt-3 text-sm font-bold">{item.label}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-8 sm:px-10 lg:py-12">
          <div className="animate-login-fade w-full max-w-md">
            <BrandLogo
              variant="full"
              size="xl"
              framed={false}
              className="mx-auto mb-6 lg:hidden"
            />
            <p className="label text-center lg:text-left">Student and Admin Portal</p>
            <h2 className="mt-2 text-center text-3xl font-bold text-ink lg:text-left">Đăng nhập</h2>
            <div className="mt-8">
              <LoginForm
                portal="school"
                buttonLabel="Vào lớp học"
                nextPath={searchParams?.next}
                supportText="Quên mật khẩu? Liên hệ giáo viên: 09xx xxx xxx"
              />
            </div>
            <Link
              href="/parents"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary/80"
            >
              Phụ huynh đăng nhập riêng
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
