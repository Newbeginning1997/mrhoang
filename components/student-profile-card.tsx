import { Award, CalendarClock, TrendingUp } from "lucide-react";
import { formatDateVN, tenureFromDate } from "@/lib/dates";
import {
  badgeLabels,
  formatScore,
  monthlyProgress,
  performanceBand,
  studentAverage
} from "@/lib/metrics";
import type { Badge, Score, Student, TeacherComment } from "@/lib/types";

export function StudentProfileCard({
  student,
  scores,
  badges,
  latestComment,
  completedThisMonth = 0,
  totalThisMonth = 0
}: {
  student: Student;
  scores: Score[];
  badges: Badge[];
  latestComment?: TeacherComment | null;
  completedThisMonth?: number;
  totalThisMonth?: number;
}) {
  const avg = studentAverage(scores);
  const band = performanceBand(avg);
  const progress = monthlyProgress(completedThisMonth, totalThisMonth);

  return (
    <article className="surface overflow-hidden">
      <div className="grid gap-5 bg-gradient-to-br from-white via-white to-mist p-5 md:grid-cols-[auto_1fr_auto] md:items-start">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-xl font-bold text-white shadow-sm ring-4 ring-primary/10">
          {student.avatar_initials}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-ink">{student.full_name}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${band.className}`}>
              {band.vi} / {band.en}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Lớp {student.class_name} · Khối {student.grade}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ProfileFact
              icon={<CalendarClock className="h-4 w-4" aria-hidden />}
              label="Ngày vào học"
              value={formatDateVN(student.enrollment_date)}
            />
            <ProfileFact
              icon={<TrendingUp className="h-4 w-4" aria-hidden />}
              label="Thâm niên"
              value={tenureFromDate(student.enrollment_date)}
            />
            <ProfileFact
              icon={<Award className="h-4 w-4" aria-hidden />}
              label="Điểm TB"
              value={formatScore(avg)}
            />
          </div>
        </div>
        <div className="min-w-[180px] rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold text-muted">
            Tiến độ tháng này
          </p>
          <div className="mt-3 h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-bold text-ink">{progress}% hoàn thành</p>
        </div>
      </div>
      <div className="border-t border-slate-200 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {badges.length ? (
            badges.map((badge) => (
              <span
                key={badge.id}
                className="rounded-full bg-sun/10 px-3 py-1 text-xs font-semibold text-sun ring-1 ring-sun/15"
              >
                {badgeLabels[badge.badge_key]?.vi ?? badge.badge_key}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted">Chưa có huy hiệu.</span>
          )}
        </div>
        {latestComment ? (
          <p className="mt-4 rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-sm leading-6 text-ink">
            <span className="font-semibold">Nhận xét mới nhất:</span>{" "}
            {latestComment.content}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function ProfileFact({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-bold text-ink">{value}</p>
    </div>
  );
}
