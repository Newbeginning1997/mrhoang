import { Trash2 } from "lucide-react";
import {
  createCalendarEventAction,
  deleteCalendarEventAction
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireSchoolUser } from "@/lib/auth";
import { formatDateVN } from "@/lib/dates";
import { getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const typeMeta = {
  exam: { label: "Kiểm tra", className: "bg-rose/10 text-rose border-rose/20" },
  holiday: { label: "Nghỉ học", className: "bg-slate-100 text-slate-700 border-slate-200" },
  homework: { label: "Bài tập", className: "bg-primary/10 text-primary border-primary/20" },
  special: { label: "Lớp đặc biệt", className: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100" }
};

function monthDays(monthParam?: string) {
  const base = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const leading = (first.getDay() + 6) % 7;
  const days = Array.from({ length: last.getDate() }, (_, index) => new Date(year, month, index + 1));
  return {
    label: new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(first),
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
    start: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    end: `${year}-${String(month + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`,
    cells: [...Array.from({ length: leading }, () => null), ...days]
  };
}

export default async function CalendarPage({
  searchParams
}: {
  searchParams?: { month?: string };
}) {
  const context = await requireSchoolUser();
  const supabase = createSupabaseAdminClient();
  const pendingCount = await getPendingHomeworkCount(context);
  const calendar = monthDays(searchParams?.month);

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("date", calendar.start)
    .lte("date", calendar.end)
    .order("date", { ascending: true });

  const byDate = new Map<string, typeof events>();
  (events ?? []).forEach((event) => {
    const dateKey = event.date.slice(0, 10);
    const rows = byDate.get(dateKey) ?? [];
    rows.push(event);
    byDate.set(dateKey, rows);
  });

  return (
    <AppShell context={context} pendingCount={pendingCount}>
      <PageHeader
        eyebrow="Calendar"
        title={`Lịch học ${calendar.label}`}
        description="Sự kiện được mã màu: kiểm tra, nghỉ học, hạn bài tập và buổi học đặc biệt."
      />

      {context.profile.role === "admin" ? (
        <form action={createCalendarEventAction} className="surface mb-6 grid gap-4 p-5 md:grid-cols-[1fr_180px_190px_auto]">
          <label className="space-y-1">
            <span className="label">Tên sự kiện</span>
            <input name="title" className="field" required />
          </label>
          <label className="space-y-1">
            <span className="label">Ngày</span>
            <input name="date" type="date" className="field" required />
          </label>
          <label className="space-y-1">
            <span className="label">Loại</span>
            <select name="type" className="field" required>
              {Object.entries(typeMeta).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-primary self-end">Thêm</button>
        </form>
      ) : null}

      <section className="surface overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase tracking-wide text-muted">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
            <div key={day} className="px-2 py-3">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendar.cells.map((day, index) => {
            const key = day ? day.toISOString().slice(0, 10) : `empty-${index}`;
            const dayEvents = day ? byDate.get(key) ?? [] : [];
            return (
              <div key={key} className="min-h-[130px] border-b border-r border-slate-100 p-2">
                {day ? (
                  <>
                    <p className="mb-2 text-sm font-bold text-ink">{day.getDate()}</p>
                    <div className="space-y-2">
                      {dayEvents.map((event) => {
                        const meta = typeMeta[event.type as keyof typeof typeMeta] ?? typeMeta.special;
                        return (
                          <div key={event.id} className={`rounded-md border px-2 py-1 text-xs font-semibold ${meta.className}`}>
                            <div className="flex items-start justify-between gap-2">
                              <span>{event.title}</span>
                              {context.profile.role === "admin" ? (
                                <form action={deleteCalendarEventAction}>
                                  <input type="hidden" name="id" value={event.id} />
                                  <button aria-label="Xóa sự kiện">
                                    <Trash2 className="h-3 w-3" aria-hidden />
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
