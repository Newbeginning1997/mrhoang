import Link from "next/link";
import { Award, BarChart3, Bell, CalendarDays, ClipboardList, Medal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StudentProfileCard } from "@/components/student-profile-card";
import { requireCurrentUser } from "@/lib/auth";
import { dueCountdown, formatDateVN } from "@/lib/dates";
import { formatScore, studentAverage } from "@/lib/metrics";
import { getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function StudentDashboardPage() {
  const context = await requireCurrentUser(["student"]);
  const supabase = createSupabaseAdminClient();
  const pendingCount = await getPendingHomeworkCount(context);
  const student = context.student!;

  const [
    { data: scores },
    { data: badges },
    { data: comments },
    { data: submissions },
    { data: homework },
    { data: announcements },
    { data: events }
  ] = await Promise.all([
    supabase
      .from("scores")
      .select("*, exams(id,title,date,max_score)")
      .eq("student_id", student.id)
      .order("created_at", { ascending: true }),
    supabase.from("badges").select("*").eq("student_id", student.id),
    supabase
      .from("teacher_comments")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("homework_submissions").select("*").eq("student_id", student.id),
    supabase.from("homework").select("*").order("due_date", { ascending: true }),
    supabase
      .from("announcements")
      .select("id,title,created_at,is_pinned")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("calendar_events")
      .select("*")
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .limit(5)
  ]);

  const submitted = new Set((submissions ?? []).map((submission) => submission.homework_id));
  const pendingHomework = (homework ?? []).filter((item) => !submitted.has(item.id));

  return (
    <AppShell context={context} pendingCount={pendingCount}>
      <PageHeader
        eyebrow="Student Dashboard"
        title="Trang học sinh"
        description="Tóm tắt điểm, bài cần nộp, thông báo mới và lịch học sắp tới."
      />

      <StudentProfileCard
        student={student}
        scores={scores ?? []}
        badges={badges ?? []}
        latestComment={comments?.[0] ?? null}
        completedThisMonth={submissions?.length ?? 0}
        totalThisMonth={homework?.length ?? 0}
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Điểm trung bình"
          value={formatScore(studentAverage(scores ?? []))}
          tone="lagoon"
          icon={<BarChart3 className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Bài chưa nộp"
          value={pendingHomework.length}
          tone="rose"
          icon={<ClipboardList className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Huy hiệu"
          value={badges?.length ?? 0}
          tone="sun"
          icon={<Award className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Tổng bài kiểm tra"
          value={scores?.length ?? 0}
          icon={<Medal className="h-5 w-5" aria-hidden />}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-rose" aria-hidden />
            <h3 className="section-title">Bài cần nộp</h3>
          </div>
          <div className="space-y-3">
            {pendingHomework.slice(0, 5).map((item) => (
              <Link key={item.id} href="/homework" className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-primary/50 hover:bg-mist/60">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-muted">{dueCountdown(item.due_date)}</p>
              </Link>
            ))}
            {!pendingHomework.length ? <p className="muted">Không có bài đang chờ nộp.</p> : null}
          </div>
        </div>

        <div className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" aria-hidden />
            <h3 className="section-title">Thông báo mới</h3>
          </div>
          <div className="space-y-3">
            {announcements?.map((item) => (
              <Link key={item.id} href="/announcements" className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-primary/50 hover:bg-mist/60">
                <p className="font-semibold text-ink">
                  {item.is_pinned ? "★ " : ""}
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-muted">{formatDateVN(item.created_at)}</p>
              </Link>
            ))}
            {!announcements?.length ? <p className="muted">Chưa có thông báo.</p> : null}
          </div>
        </div>

        <div className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-lagoon" aria-hidden />
            <h3 className="section-title">Lịch sắp tới</h3>
          </div>
          <div className="space-y-3">
            {events?.map((event) => (
              <Link key={event.id} href="/calendar" className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-primary/50 hover:bg-mist/60">
                <p className="font-semibold text-ink">{event.title}</p>
                <p className="mt-1 text-xs text-muted">{formatDateVN(event.date)}</p>
              </Link>
            ))}
            {!events?.length ? <p className="muted">Chưa có sự kiện sắp tới.</p> : null}
          </div>
        </div>
      </section>

      <Link href={`/scores/${student.id}`} className="btn-primary mt-6">
        <Medal className="h-4 w-4" aria-hidden />
        Xem báo cáo điểm đầy đủ
      </Link>
    </AppShell>
  );
}
