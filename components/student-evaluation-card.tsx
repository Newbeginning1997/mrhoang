import { AlertTriangle, BarChart3, CheckCircle2, ListChecks } from "lucide-react";
import { deriveStudentEvaluation } from "@/lib/evaluation";
import type { Score } from "@/lib/types";

function BulletList({
  icon: Icon,
  title,
  items,
  tone
}: {
  icon: typeof CheckCircle2;
  title: string;
  items: string[];
  tone: "good" | "warn" | "action";
}) {
  const styles = {
    good: "text-emerald-700 bg-emerald-50 ring-emerald-100",
    warn: "text-amber-700 bg-amber-50 ring-amber-100",
    action: "text-primary bg-primary/10 ring-primary/15"
  }[tone];

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1 ${styles}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h4 className="text-sm font-bold text-ink">{title}</h4>
      </div>
      <ul className="space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-45" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StudentEvaluationCard({ scores }: { scores: Score[] }) {
  const evaluation = deriveStudentEvaluation(scores);

  return (
    <section className="surface mt-6 p-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="label">Đánh giá năng lực</p>
          <h3 className="mt-1 text-xl font-bold text-ink">{evaluation.headline}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{evaluation.summary}</p>
        </div>
        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${evaluation.band.className}`}>
          {evaluation.band.vi} / {evaluation.band.en}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {evaluation.evidence.map((item) => (
          <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{item.label}</p>
            <p className="mt-1 text-sm font-bold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <BulletList
          icon={CheckCircle2}
          title="Điểm mạnh"
          items={evaluation.strengths}
          tone="good"
        />
        <BulletList
          icon={AlertTriangle}
          title="Cần cải thiện"
          items={evaluation.improvements}
          tone="warn"
        />
        <BulletList
          icon={ListChecks}
          title="Nên làm tiếp theo"
          items={evaluation.actions}
          tone="action"
        />
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-md bg-mist px-3 py-2 text-xs leading-5 text-muted">
        <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          Đánh giá được tính tự động từ điểm kiểm tra đã nhập. Phụ huynh, học sinh và giáo viên
          nhìn cùng một dữ liệu để theo dõi tiến bộ minh bạch hơn.
        </p>
      </div>
    </section>
  );
}
