"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  Medal,
  UsersRound
} from "lucide-react";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: keyof typeof icons;
  badge?: number;
};

const icons = {
  dashboard: LayoutDashboard,
  users: UsersRound,
  scores: BarChart3,
  announcements: Bell,
  homework: ClipboardList,
  documents: LibraryBig,
  calendar: CalendarDays,
  statistics: GraduationCap,
  quiz: FileText,
  medal: Medal
};

function isActivePath(pathname: string, href: string) {
  if (href === "/admin" || href === "/student") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNavLink({ item }: { item: ShellNavItem }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = icons[item.icon];

  return (
    <Link
      href={item.href}
      className={`group relative flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-primary text-white shadow-[0_12px_26px_rgba(21,116,95,0.25)]"
          : "text-slate-600 hover:bg-mist hover:text-primary"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-primary"}`}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span
          className={`min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-bold ${
            active ? "bg-white/20 text-white" : "bg-rose text-white"
          }`}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function MobileNavLink({ item }: { item: ShellNavItem }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = icons[item.icon];

  return (
    <Link
      href={item.href}
      className={`relative inline-flex h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
        active
          ? "border-primary bg-primary text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-mist hover:text-primary"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {item.label}
      {item.badge ? (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
            active ? "bg-white/20 text-white" : "bg-rose text-white"
          }`}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
