import { CheckCircle2, Clock, Paperclip, Send, Star } from "lucide-react";
import {
  createHomeworkAction,
  gradeHomeworkAction,
  submitHomeworkAction
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireSchoolUser } from "@/lib/auth";
import { dueCountdown, formatDateTimeVN, formatDateVN } from "@/lib/dates";
import { fileDownloadPath, getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function HomeworkPage() {
  const context = await requireSchoolUser();
  const supabase = createSupabaseAdminClient();
  const pendingCount = await getPendingHomeworkCount(context);

  const [{ data: homework }, { data: students }, { data: submissions }] = await Promise.all([
    supabase.from("homework").select("*").order("due_date", { ascending: false }),
    context.profile.role === "admin" ? supabase.from("students").select("*").order("full_name") : Promise.resolve({ data: [] }),
    supabase
      .from("homework_submissions")
      .select("*")
      .order("submitted_at", { ascending: false })
  ]);

  const studentById = new Map((students ?? []).map((student) => [student.id, student]));
  const submissionsByHomework = new Map<string, typeof submissions>();
  (submissions ?? []).forEach((submission) => {
    const rows = submissionsByHomework.get(submission.homework_id) ?? [];
    rows.push(submission);
    submissionsByHomework.set(submission.homework_id, rows);
  });

  const studentSubmissions = new Map(
    (submissions ?? [])
      .filter((submission) => submission.student_id === context.student?.id)
      .map((submission) => [submission.homework_id, submission])
  );

  return (
    <AppShell context={context} pendingCount={pendingCount}>
      <PageHeader
        eyebrow="Homework"
        title="Bài tập về nhà"
        description="Học sinh có thể nộp bài bằng văn bản hoặc tệp; giáo viên xem trạng thái, chấm điểm và phản hồi."
      />

      {context.profile.role === "admin" ? (
        <form
          action={createHomeworkAction}
          className="surface mb-6 grid gap-4 p-5 lg:grid-cols-[1fr_1fr_auto]"
          encType="multipart/form-data"
        >
          <label className="space-y-1">
            <span className="label">Tiêu đề</span>
            <input name="title" className="field" required />
          </label>
          <label className="space-y-1">
            <span className="label">Mô tả</span>
            <textarea name="description" rows={3} className="field" required />
          </label>
          <div className="grid gap-3">
            <label className="space-y-1">
              <span className="label">Hạn nộp</span>
              <input name="due_date" type="datetime-local" className="field" required />
            </label>
            <label className="space-y-1">
              <span className="label">Tệp bài tập</span>
              <input name="file" type="file" className="field" accept=".pdf,.doc,.docx,image/*" />
            </label>
            <button className="btn-primary">Thêm bài tập</button>
          </div>
        </form>
      ) : null}

      <section className="space-y-5">
        {homework?.map((item) => {
          const fileHref = fileDownloadPath(
            process.env.SUPABASE_BUCKET_HOMEWORK ?? "homework",
            item.file_url
          );
          const rows = submissionsByHomework.get(item.id) ?? [];
          const ownSubmission = studentSubmissions.get(item.id);
          const submittedIds = new Set(rows.map((row) => row.student_id));

          return (
            <article key={item.id} className="surface overflow-hidden">
              <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-ink">{item.title}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      <Clock className="h-3 w-3" aria-hidden />
                      {dueCountdown(item.due_date)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{item.description}</p>
                  <p className="mt-2 text-xs text-muted">Hạn nộp: {formatDateTimeVN(item.due_date)}</p>
                  {fileHref ? (
                    <a href={fileHref} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      <Paperclip className="h-4 w-4" aria-hidden />
                      Tải đề bài
                    </a>
                  ) : null}
                </div>

                {context.profile.role === "student" ? (
                  <div className="min-w-[260px] rounded-lg bg-slate-50 p-4">
                    {ownSubmission ? (
                      <div className="mb-3 rounded-md bg-lagoon/10 px-3 py-2 text-sm font-semibold text-lagoon">
                        <CheckCircle2 className="mr-1 inline h-4 w-4" aria-hidden />
                        Đã nộp {formatDateVN(ownSubmission.submitted_at)}
                      </div>
                    ) : null}
                    <form action={submitHomeworkAction} className="space-y-3" encType="multipart/form-data">
                      <input type="hidden" name="homework_id" value={item.id} />
                      <textarea name="content" rows={3} className="field" placeholder="Nội dung bài làm" />
                      <input name="file" type="file" className="field" accept=".pdf,.doc,.docx,image/*" />
                      <button className="btn-primary w-full">
                        <Send className="h-4 w-4" aria-hidden />
                        {ownSubmission ? "Nộp lại" : "Nộp bài"}
                      </button>
                    </form>
                    {ownSubmission?.score !== null && ownSubmission?.score !== undefined ? (
                      <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-ink">
                        <Star className="mr-1 inline h-4 w-4 text-sun" aria-hidden />
                        Điểm: <b>{ownSubmission.score}</b>
                        {ownSubmission.feedback ? ` · ${ownSubmission.feedback}` : ""}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {context.profile.role === "admin" ? (
                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  <h4 className="mb-3 font-bold text-ink">Trạng thái nộp bài</h4>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {(students ?? []).map((student) => {
                      const submission = rows.find((row) => row.student_id === student.id);
                      return (
                        <div key={student.id} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{student.full_name}</p>
                              <p className="text-xs text-muted">Lớp {student.class_name}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-xs font-bold ${submittedIds.has(student.id) ? "bg-lagoon/10 text-lagoon" : "bg-rose/10 text-rose"}`}>
                              {submittedIds.has(student.id) ? "Đã nộp" : "Chưa nộp"}
                            </span>
                          </div>
                          {submission ? (
                            <form action={gradeHomeworkAction} className="mt-3 grid gap-2">
                              <input type="hidden" name="submission_id" value={submission.id} />
                              <input type="hidden" name="student_id" value={student.id} />
                              <input name="score" type="number" step="0.1" min="0" max="10" className="field" placeholder="Điểm" defaultValue={submission.score ?? ""} required />
                              <input name="feedback" className="field" placeholder="Nhận xét ngắn" defaultValue={submission.feedback ?? ""} />
                              <button className="btn-secondary">Lưu điểm</button>
                            </form>
                          ) : null}
                        </div>
                      );
                    })}
                    {!studentById.size ? <p className="muted">Chưa có học sinh.</p> : null}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
        {!homework?.length ? (
          <div className="surface p-6 text-center text-muted">Chưa có bài tập.</div>
        ) : null}
      </section>
    </AppShell>
  );
}
