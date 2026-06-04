import { BrandLogo } from "@/components/brand-logo";
import { LogoutButton } from "@/components/logout-button";
import { MobileNavLink, SidebarNavLink, type ShellNavItem } from "@/components/nav-link";
import type { AppContext } from "@/lib/types";

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AppShell({
  context,
  children,
  pendingCount = 0
}: {
  context: AppContext;
  children: React.ReactNode;
  pendingCount?: number;
}) {
  const role = context.profile.role;
  const studentId = context.student?.id;
  const displayName =
    context.student?.full_name ??
    (role === "admin" ? "Teacher Admin" : context.profile.username);
  const subtitle =
    role === "admin"
      ? "Quản trị lớp học"
      : `${context.student?.class_name ?? "Lớp học"} · ${context.profile.username}`;
  const roleLabel = role === "admin" ? "Teacher" : "Student";
  const nav: ShellNavItem[] =
    role === "admin"
      ? [
          { href: "/admin", label: "Dashboard", icon: "dashboard" },
          { href: "/admin/users", label: "Tài khoản", icon: "users" },
          { href: "/scores", label: "Điểm số", icon: "scores" },
          { href: "/announcements", label: "Thông báo", icon: "announcements" },
          { href: "/homework", label: "Bài tập", icon: "homework", badge: pendingCount },
          { href: "/documents", label: "Tài liệu", icon: "documents" },
          { href: "/calendar", label: "Lịch học", icon: "calendar" },
          { href: "/statistics", label: "Thống kê", icon: "statistics" },
          { href: "/quiz", label: "Quiz", icon: "quiz" }
        ]
      : [
          { href: "/student", label: "Dashboard", icon: "dashboard" },
          { href: "/announcements", label: "Thông báo", icon: "announcements" },
          { href: "/homework", label: "Bài tập", icon: "homework", badge: pendingCount },
          { href: "/documents", label: "Tài liệu", icon: "documents" },
          { href: "/calendar", label: "Lịch học", icon: "calendar" },
          { href: "/quiz", label: "Quiz", icon: "quiz" },
          {
            href: studentId ? `/scores/${studentId}` : "/student",
            label: "Điểm của em",
            icon: "medal"
          }
        ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-wide text-muted">
                Mr Hoàng English
              </p>
              <h1 className="truncate text-base font-bold text-ink">{displayName}</h1>
            </div>
          </div>
          <div className="hidden sm:block">
            <LogoutButton />
          </div>
        </div>
        <nav className="scrollbar-thin flex gap-2 overflow-x-auto px-4 pb-3">
          {nav.map((item) => (
            <MobileNavLink key={item.href} item={item} />
          ))}
        </nav>
      </header>

      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200 bg-white/90 px-5 py-5 shadow-[1px_0_0_rgba(255,255,255,0.8)] backdrop-blur lg:flex">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                Mr Hoàng English
              </p>
              <h1 className="truncate text-lg font-bold text-ink">Class Manager</h1>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-primary/15 bg-gradient-to-br from-primary/10 via-white to-lagoon/10 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-primary shadow-sm ring-1 ring-primary/15">
                {initials(displayName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
              </div>
            </div>
            <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/15">
              {roleLabel}
            </div>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-1.5">
            {nav.map((item) => (
              <SidebarNavLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="border-t border-slate-200 pt-4">
            <LogoutButton />
          </div>
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 hidden items-center justify-between gap-4 border-b border-slate-200 pb-5 lg:flex">
            <div>
              <p className="label">Workspace</p>
              <p className="mt-1 text-lg font-bold text-ink">
                {role === "admin" ? "Bảng quản trị giáo viên" : `Xin chào, ${displayName}`}
              </p>
            </div>
            <div className="rounded-full bg-lagoon/10 px-3 py-1 text-sm font-bold text-lagoon ring-1 ring-lagoon/15">
              Online
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function ParentShell({
  context,
  children
}: {
  context: AppContext;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div>
              <p className="label">Parent Dashboard</p>
              <h1 className="mt-1 text-xl font-bold text-ink">
                Theo dõi học sinh khối {context.parent?.grade}
              </h1>
            </div>
          </div>
          <LogoutButton parent />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
