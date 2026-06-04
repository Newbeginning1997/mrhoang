import type { BadgeKey, PerformanceBand, Score, Student } from "@/lib/types";

export const badgeLabels: Record<BadgeKey, { vi: string; en: string }> = {
  punctual_10: { vi: "Chuyên cần", en: "Punctual" },
  tenure_3_months: { vi: "Thâm niên 3 tháng", en: "3-month tenure" },
  tenure_6_months: { vi: "Thâm niên 6 tháng", en: "6-month tenure" },
  tenure_1_year: { vi: "Thâm niên 1 năm", en: "1-year tenure" },
  top_5: { vi: "Top 5 lớp", en: "Top 5" },
  improved_20: { vi: "Cải thiện 20%", en: "Improved 20%" },
  top_score_week: { vi: "Điểm cao nhất tuần", en: "Weekly top score" },
  excellent_student: { vi: "Học sinh xuất sắc", en: "Excellent student" }
};

export function average(scores: Array<number | null | undefined>) {
  const valid = scores
    .map((score) => Number(score))
    .filter((score) => Number.isFinite(score));

  if (!valid.length) return null;
  return valid.reduce((sum, score) => sum + score, 0) / valid.length;
}

export function studentAverage(scores: Score[]) {
  return average(scores.map((row) => row.score));
}

export function formatScore(score: number | null | undefined) {
  if (score === null || score === undefined || !Number.isFinite(Number(score))) {
    return "Chưa có";
  }

  return Number(score).toFixed(1);
}

export function performanceBand(avg: number | null | undefined): PerformanceBand {
  const value = avg ?? 0;

  if (value < 5) {
    return {
      key: "beginner",
      vi: "Sơ cấp",
      en: "Beginner",
      className: "bg-rose-50 text-rose-700 ring-rose-100"
    };
  }

  if (value < 6.5) {
    return {
      key: "pre_intermediate",
      vi: "Tiền trung cấp",
      en: "Pre-Intermediate",
      className: "bg-amber-50 text-amber-700 ring-amber-100"
    };
  }

  if (value < 8) {
    return {
      key: "intermediate",
      vi: "Trung cấp",
      en: "Intermediate",
      className: "bg-cyan-50 text-cyan-700 ring-cyan-100"
    };
  }

  return {
    key: "upper_intermediate",
    vi: "Trên trung cấp",
    en: "Upper-Intermediate",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100"
  };
}

export function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function monthlyProgress(completed: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

export function scoreTrend(scores: Score[]) {
  const ordered = [...scores].sort((a, b) => {
    const aDate = a.exams?.date ?? a.created_at;
    const bDate = b.exams?.date ?? b.created_at;
    return new Date(aDate).getTime() - new Date(bDate).getTime();
  });

  if (ordered.length < 2) return "stable" as const;
  const previous = ordered[ordered.length - 2].score;
  const latest = ordered[ordered.length - 1].score;

  if (latest > previous) return "up" as const;
  if (latest < previous) return "down" as const;
  return "stable" as const;
}

export function sortStudentsByAverage<T extends { student: Student; scores: Score[] }>(
  rows: T[]
) {
  return [...rows].sort((a, b) => {
    const aAvg = studentAverage(a.scores) ?? -1;
    const bAvg = studentAverage(b.scores) ?? -1;
    return bAvg - aAvg;
  });
}
