import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  PenLine,
  TrendingUp,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ClassAverageChart, PerformanceBandPieChart } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeVN, formatDateVN } from "@/lib/dates";
import { average, formatScore, performanceBand } from "@/lib/metrics";
import { getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Grade } from "@/lib/types";

type GradeFilter = Grade | null;
type ActivityIcon = "announcement" | "homework" | "submission" | "score";
type ActivityTone = "primary" | "lagoon" | "sun" | "rose";

type DashboardStudent = {
  id: string;
  full_name: string;
  class_name: string;
  grade: Grade;
  average?: number;
};

type DashboardScore = {
  id: string;
  studentId: string;
  grade: Grade | null;
  score: number;
  createdAt: string;
};

type DashboardActivity = {
  id: string;
  title: string;
  timestamp: string;
  type: string;
  grade: Grade | null;
  icon: ActivityIcon;
  tone: ActivityTone;
};

type DashboardExam = {
  id: string;
  title: string;
  date: string;
  subject: string;
  grade: Grade | null;
};

const grades = [6, 7, 8, 9] as const;
const dayMs = 24 * 60 * 60 * 1000;

const mockStudentNames: Record<Grade, string[]> = {
  6: [
    "Nguyễn Minh Anh",
    "Trần Bảo Ngọc",
    "Lê Gia Huy",
    "Phạm Khánh Linh",
    "Đỗ Nhật Nam",
    "Vũ Hoàng Yến",
    "Bùi Minh Khang",
    "Hoàng Tú Anh"
  ],
  7: [
    "Đặng Hải Đăng",
    "Nguyễn Mai Chi",
    "Trần Quốc Bảo",
    "Lê Hà My",
    "Phạm Đức Anh",
    "Vũ Thanh Tâm",
    "Bùi Lan Anh",
    "Hoàng Minh Quân"
  ],
  8: [
    "Nguyễn Phương Thảo",
    "Trần Gia Bảo",
    "Lê Minh Đức",
    "Phạm Ngọc Hân",
    "Đỗ Tuấn Kiệt",
    "Vũ Hải Yến",
    "Bùi Quang Minh",
    "Hoàng Bảo Trâm"
  ],
  9: [
    "Nguyễn Tuấn Anh",
    "Trần Nhật Minh",
    "Lê Khánh Vy",
    "Phạm Gia Hân",
    "Đỗ Minh Châu",
    "Vũ Anh Khoa",
    "Bùi Hà Linh",
    "Hoàng Đức Long"
  ]
};

const mockStudentCountByGrade: Record<Grade, number> = {
  6: 24,
  7: 27,
  8: 26,
  9: 23
};

const mockAverageByGrade: Record<Grade, number[]> = {
  6: [4.8, 5.9, 6.8, 7.5, 8.4, 8.8, 7.2, 6.4],
  7: [5.1, 6.1, 7.0, 7.8, 8.6, 8.9, 6.7, 7.4],
  8: [4.9, 6.0, 7.2, 7.9, 8.5, 9.1, 6.8, 7.6],
  9: [5.3, 6.2, 7.3, 8.0, 8.7, 9.2, 6.9, 7.7]
};

const activityIcons: Record<ActivityIcon, LucideIcon> = {
  announcement: Bell,
  homework: ClipboardList,
  submission: CheckCircle2,
  score: PenLine
};

const activityToneClass: Record<ActivityTone, string> = {
  primary: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  lagoon: "bg-blue-100 text-blue-700 ring-blue-200",
  sun: "bg-amber-100 text-amber-700 ring-amber-200",
  rose: "bg-rose-100 text-rose-700 ring-rose-200"
};

function parseGrade(value?: string): GradeFilter {
  const grade = Number(value);
  return grades.includes(grade as Grade) ? (grade as Grade) : null;
}

function gradeLabel(grade: Grade | null) {
  return grade ? `Lớp ${grade}` : "Tất cả";
}

function matchesGrade(rowGrade: Grade | null, selectedGrade: GradeFilter) {
  return !selectedGrade || !rowGrade || rowGrade === selectedGrade;
}

function relativeDate(days: number, hours = 0) {
  return new Date(Date.now() + days * dayMs + hours * 60 * 60 * 1000).toISOString();
}

function relativeDateOnly(days: number) {
  return relativeDate(days).slice(0, 10);
}

function weekLabel(index: number) {
  const date = new Date(Date.now() - (5 - index) * 7 * dayMs);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

const mockStudents: DashboardStudent[] = grades.flatMap((grade) =>
  mockStudentNames[grade].map((name, index) => ({
    id: `mock-student-${grade}-${index}`,
    full_name: name,
    class_name: `${grade}${index % 2 === 0 ? "A" : "B"}`,
    grade,
    average: mockAverageByGrade[grade][index]
  }))
);

function selectedMockStudents(selectedGrade: GradeFilter) {
  return mockStudents.filter((student) => matchesGrade(student.grade, selectedGrade));
}

function mockTrendData(selectedGrade: GradeFilter) {
  const base = selectedGrade ? 6.55 + (selectedGrade - 6) * 0.28 : 7.18;
  const offsets = [-0.18, 0.05, -0.02, 0.16, 0.24, 0.38];

  return offsets.map((offset, index) => ({
    label: weekLabel(index),
    average: Number((base + offset).toFixed(1))
  }));
}

function realTrendData(scores: DashboardScore[]) {
  const now = Date.now();
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const weekEnd = now - (5 - index) * 7 * dayMs;
    const weekStart = weekEnd - 6 * dayMs;
    const values = scores
      .filter((score) => {
        const time = new Date(score.createdAt).getTime();
        return time >= weekStart && time <= weekEnd;
      })
      .map((score) => score.score);
    const weekAverage = average(values);

    return {
      label: weekLabel(index),
      average: Number((weekAverage ?? 0).toFixed(1)),
      hasData: weekAverage !== null
    };
  });

  if (weeks.filter((week) => week.hasData).length < 3) return null;
  return weeks.map(({ label, average }) => ({ label, average }));
}

function mockUpcomingExams() {
  return [
    { id: "mock-exam-6-1", title: "Unit 8 Progress Test", subject: "Grammar & Vocabulary", grade: 6 as Grade, date: relativeDateOnly(3) },
    { id: "mock-exam-6-2", title: "Reading Checkpoint", subject: "Reading", grade: 6 as Grade, date: relativeDateOnly(13) },
    { id: "mock-exam-6-3", title: "Speaking Mini Interview", subject: "Speaking", grade: 6 as Grade, date: relativeDateOnly(24) },
    { id: "mock-exam-7-1", title: "Listening Practice Test", subject: "Listening", grade: 7 as Grade, date: relativeDateOnly(5) },
    { id: "mock-exam-7-2", title: "Writing Task Review", subject: "Writing", grade: 7 as Grade, date: relativeDateOnly(16) },
    { id: "mock-exam-7-3", title: "Vocabulary Sprint", subject: "Vocabulary", grade: 7 as Grade, date: relativeDateOnly(27) },
    { id: "mock-exam-8-1", title: "Mid-unit Grammar Test", subject: "Grammar", grade: 8 as Grade, date: relativeDateOnly(4) },
    { id: "mock-exam-8-2", title: "Reading Comprehension", subject: "Reading", grade: 8 as Grade, date: relativeDateOnly(17) },
    { id: "mock-exam-8-3", title: "Listening Lab", subject: "Listening", grade: 8 as Grade, date: relativeDateOnly(29) },
    { id: "mock-exam-9-1", title: "Entrance Prep Mock Test", subject: "Exam Skills", grade: 9 as Grade, date: relativeDateOnly(6) },
    { id: "mock-exam-9-2", title: "Writing Band Check", subject: "Writing", grade: 9 as Grade, date: relativeDateOnly(19) },
    { id: "mock-exam-9-3", title: "Final Speaking Round", subject: "Speaking", grade: 9 as Grade, date: relativeDateOnly(31) }
  ];
}

function mockActivities(): DashboardActivity[] {
  return grades.flatMap((grade, gradeIndex) => [
    {
      id: `mock-submission-${grade}`,
      title: `${mockStudentNames[grade][0]} đã nộp Writing Task ${grade}`,
      timestamp: relativeDate(0, -1 - gradeIndex * 0.25),
      type: "Nộp bài",
      grade,
      icon: "submission",
      tone: "lagoon"
    },
    {
      id: `mock-score-${grade}`,
      title: `Đã nhập điểm Listening Practice cho lớp ${grade}A`,
      timestamp: relativeDate(0, -3 - gradeIndex * 0.35),
      type: "Nhập điểm",
      grade,
      icon: "score",
      tone: "sun"
    },
    {
      id: `mock-homework-${grade}`,
      title: `Giao bài Vocabulary Review cho lớp ${grade}B`,
      timestamp: relativeDate(-1, -gradeIndex * 0.2),
      type: "Bài tập",
      grade,
      icon: "homework",
      tone: "primary"
    },
    {
      id: `mock-announcement-${grade}`,
      title: `Thông báo lịch kiểm tra tuần này cho khối ${grade}`,
      timestamp: relativeDate(-1, -2 - gradeIndex * 0.2),
      type: "Thông báo",
      grade,
      icon: "announcement",
      tone: "rose"
    },
    {
      id: `mock-submission-late-${grade}`,
      title: `${mockStudentNames[grade][3]} đã nộp lại Reading Worksheet`,
      timestamp: relativeDate(-2, -gradeIndex * 0.3),
      type: "Nộp bài",
      grade,
      icon: "submission",
      tone: "lagoon"
    }
  ]);
}

function inferGrade(title: string): Grade | null {
  const match = title.match(/(?:khối|khoi|lớp|lop|grade)\s*([6789])/i);
  const grade = Number(match?.[1]);
  return grades.includes(grade as Grade) ? (grade as Grade) : null;
}

function inferSubject(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("listening")) return "Listening";
  if (lower.includes("writing")) return "Writing";
  if (lower.includes("reading")) return "Reading";
  if (lower.includes("speaking")) return "Speaking";
  if (lower.includes("grammar")) return "Grammar";
  if (lower.includes("vocabulary") || lower.includes("vocab")) return "Vocabulary";
  return "English Skills";
}

function buildBandPieData(
  selectedGrade: GradeFilter,
  students: DashboardStudent[],
  scores: DashboardScore[]
) {
  const scoresByStudent = new Map<string, number[]>();

  scores.forEach((score) => {
    const rows = scoresByStudent.get(score.studentId) ?? [];
    rows.push(score.score);
    scoresByStudent.set(score.studentId, rows);
  });

  let averages = students
    .map((student) => average(scoresByStudent.get(student.id) ?? []))
    .filter((value): value is number => value !== null);

  if (averages.length < 4) {
    averages = selectedMockStudents(selectedGrade).map((student) => student.average ?? 0);
  }

  const counts = {
    beginner: 0,
    pre_intermediate: 0,
    intermediate: 0,
    upper_intermediate: 0
  };

  averages.forEach((value) => {
    counts[performanceBand(value).key]++;
  });

  return [
    { name: "Beginner", value: counts.beginner, color: "#E11D48" },
    { name: "Pre-Intermediate", value: counts.pre_intermediate, color: "#D97706" },
    { name: "Intermediate", value: counts.intermediate, color: "#2563EB" },
    { name: "Upper-Intermediate", value: counts.upper_intermediate, color: "#15745F" }
  ];
}

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams?: { grade?: string };
}) {
  const selectedGrade = parseGrade(searchParams?.grade);
  const context = await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const shellPendingCount = await getPendingHomeworkCount(context);

  const [
    { data: students },
    { data: scores },
    { data: upcomingExams },
    { data: recentAnnouncements },
    { data: recentHomework },
    { data: recentSubmissions }
  ] = await Promise.all([
    supabase.from("students").select("id,full_name,class_name,grade").order("class_name").order("full_name"),
    supabase.from("scores").select("id,score,created_at,student_id").order("created_at", { ascending: false }),
    supabase
      .from("exams")
      .select("id,title,date")
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .limit(8),
    supabase
      .from("announcements")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("homework")
      .select("id,title,created_at,due_date")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("homework_submissions")
      .select("id,student_id,homework_id,submitted_at,score,homework(title)")
      .order("submitted_at", { ascending: false })
      .limit(10)
  ]);

  const realStudents: DashboardStudent[] = (students ?? []).map((student) => ({
    id: student.id,
    full_name: student.full_name,
    class_name: student.class_name,
    grade: student.grade as Grade
  }));
  const filteredRealStudents = realStudents.filter((student) =>
    matchesGrade(student.grade, selectedGrade)
  );
  const visibleStudents = filteredRealStudents.length
    ? filteredRealStudents
    : selectedMockStudents(selectedGrade);
  const studentById = new Map(realStudents.map((student) => [student.id, student]));

  const filteredScores: DashboardScore[] = (scores ?? [])
    .map((score) => {
      const student = studentById.get(score.student_id);
      return {
        id: score.id,
        studentId: score.student_id,
        grade: student?.grade ?? null,
        score: Number(score.score),
        createdAt: score.created_at
      };
    })
    .filter((score) => Number.isFinite(score.score) && matchesGrade(score.grade, selectedGrade));

  const totalStudents = filteredRealStudents.length
    ? filteredRealStudents.length
    : selectedGrade
      ? mockStudentCountByGrade[selectedGrade]
      : grades.reduce((sum, grade) => sum + mockStudentCountByGrade[grade], 0);
  const classAverage =
    filteredScores.length > 0
      ? average(filteredScores.map((score) => score.score))
      : average(selectedMockStudents(selectedGrade).map((student) => student.average));
  const pendingSubmissionCount =
    (recentSubmissions ?? []).filter((submission) => {
      const student = studentById.get(submission.student_id);
      return submission.score === null && matchesGrade(student?.grade ?? null, selectedGrade);
    }).length || (selectedGrade ? 5 + (selectedGrade - 6) : 22);
  const trendData = realTrendData(filteredScores) ?? mockTrendData(selectedGrade);
  const bandData = buildBandPieData(selectedGrade, visibleStudents, filteredScores);

  const realExamRows: DashboardExam[] = (upcomingExams ?? []).map((exam) => {
    const inferredGrade = inferGrade(exam.title);
    return {
      id: exam.id,
      title: exam.title,
      date: exam.date,
      subject: inferSubject(exam.title),
      grade: inferredGrade ?? selectedGrade
    };
  });
  const upcomingExamRows = [
    ...realExamRows.filter((exam) => matchesGrade(exam.grade, selectedGrade)),
    ...mockUpcomingExams().filter((exam) => matchesGrade(exam.grade, selectedGrade))
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const scoreActivities: DashboardActivity[] = filteredScores.slice(0, 5).map((score) => {
    const student = studentById.get(score.studentId);
    return {
      id: `score-${score.id}`,
      title: `Đã nhập điểm cho ${student?.full_name ?? "học sinh"}`,
      timestamp: score.createdAt,
      type: "Nhập điểm",
      grade: score.grade,
      icon: "score",
      tone: "sun"
    };
  });
  const submissionActivities: DashboardActivity[] = (recentSubmissions ?? []).map((submission) => {
    const student = studentById.get(submission.student_id);
    const homework = Array.isArray(submission.homework)
      ? submission.homework[0]
      : submission.homework;

    return {
      id: `submission-${submission.id}`,
      title: `${student?.full_name ?? "Học sinh"} đã nộp ${homework?.title ?? "bài tập"}`,
      timestamp: submission.submitted_at,
      type: "Nộp bài",
      grade: student?.grade ?? null,
      icon: "submission",
      tone: "lagoon"
    };
  });
  const announcementActivities: DashboardActivity[] = (recentAnnouncements ?? []).map((item) => ({
    id: `announcement-${item.id}`,
    title: item.title,
    timestamp: item.created_at,
    type: "Thông báo",
    grade: null,
    icon: "announcement",
    tone: "rose"
  }));
  const homeworkActivities: DashboardActivity[] = (recentHomework ?? []).map((item) => ({
    id: `homework-${item.id}`,
    title: item.title,
    timestamp: item.created_at,
    type: "Bài tập",
    grade: null,
    icon: "homework",
    tone: "primary"
  }));
  const activityRows = [
    ...scoreActivities,
    ...submissionActivities,
    ...announcementActivities,
    ...homeworkActivities,
    ...mockActivities()
  ]
    .filter((activity) => matchesGrade(activity.grade, selectedGrade))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <AppShell context={context} pendingCount={shellPendingCount}>
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Tổng quan lớp học"
        description={`Theo dõi sĩ số, điểm trung bình, bài nộp cần chấm và lịch kiểm tra cho ${gradeLabel(selectedGrade).toLowerCase()}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/announcements" className="btn-secondary">
              <Bell className="h-4 w-4" aria-hidden />
              Đăng thông báo
            </Link>
            <Link href="/homework" className="btn-secondary">
              <ClipboardList className="h-4 w-4" aria-hidden />
              Thêm bài tập
            </Link>
            <Link href="/scores" className="btn-primary">
              <PenLine className="h-4 w-4" aria-hidden />
              Nhập điểm
            </Link>
          </div>
        }
      />

      <section className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label">Lọc dữ liệu</p>
          <p className="mt-1 text-sm font-semibold text-ink">{gradeLabel(selectedGrade)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[null, ...grades].map((grade) => {
            const active = grade === selectedGrade;
            return (
              <Link
                key={grade ?? "all"}
                href={grade ? `/admin?grade=${grade}` : "/admin"}
                className={`rounded-md border px-3 py-2 text-sm font-bold transition ${
                  active
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-mist hover:text-primary"
                }`}
              >
                {gradeLabel(grade)}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng học sinh"
          value={totalStudents}
          help={selectedGrade ? `Khối ${selectedGrade}` : "Grades 6-9"}
          icon={<UsersRound className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Điểm TB lớp"
          value={formatScore(classAverage)}
          help="Tính theo bộ lọc hiện tại"
          tone="lagoon"
          icon={<BarChart3 className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Bài nộp chờ chấm"
          value={pendingSubmissionCount}
          help="Homework submissions pending"
          tone="rose"
          icon={<ClipboardList className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Bài kiểm tra sắp tới"
          value={upcomingExamRows.length}
          help="Next upcoming exams"
          tone="sun"
          icon={<CalendarDays className="h-5 w-5" aria-hidden />}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="section-title">Xu hướng điểm trung bình</h3>
              <p className="muted">Class average over the last 6 weeks</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 ring-1 ring-blue-200">
              <TrendingUp className="h-5 w-5" aria-hidden />
            </div>
          </div>
          <ClassAverageChart data={trendData} />
        </div>

        <div className="surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="section-title">Band năng lực</h3>
              <p className="muted">Beginner to Upper-Intermediate</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
              <BarChart3 className="h-5 w-5" aria-hidden />
            </div>
          </div>
          <PerformanceBandPieChart data={bandData} />
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="section-title">Hoạt động gần đây</h3>
              <p className="muted">5 updates mới nhất theo bộ lọc</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <FilePlus2 className="h-5 w-5" aria-hidden />
            </div>
          </div>
          <div className="space-y-3">
            {activityRows.map((activity) => {
              const Icon = activityIcons[activity.icon];
              return (
                <div
                  key={activity.id}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-primary/30 hover:bg-mist/60"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${activityToneClass[activity.tone]}`}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {activity.type}
                        </span>
                        {activity.grade ? (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                            Lớp {activity.grade}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 font-semibold text-ink">{activity.title}</p>
                      <p className="mt-1 text-xs text-muted">{formatDateTimeVN(activity.timestamp)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="section-title">Lịch kiểm tra</h3>
              <p className="muted">3 kỳ kiểm tra gần nhất sắp diễn ra</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lagoon/10 text-lagoon ring-1 ring-lagoon/15">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </div>
          </div>
          <div className="space-y-3">
            {upcomingExamRows.map((exam) => (
              <div key={exam.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{exam.title}</p>
                    <p className="mt-1 text-sm text-muted">{exam.subject}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-sun/10 px-3 py-1 text-xs font-bold text-sun ring-1 ring-sun/15">
                    {gradeLabel(exam.grade)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold text-primary">{formatDateVN(exam.date)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
