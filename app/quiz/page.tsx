import { createQuizAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { QuizTakeForm } from "@/components/quiz-take-form";
import { requireSchoolUser } from "@/lib/auth";
import { formatDateVN } from "@/lib/dates";
import { getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function QuizPage() {
  const context = await requireSchoolUser();
  const supabase = createSupabaseAdminClient();
  const pendingCount = await getPendingHomeworkCount(context);

  const [{ data: quizzes }, { data: questions }, { data: results }] = await Promise.all([
    supabase.from("quiz").select("*").order("created_at", { ascending: false }),
    supabase.from("quiz_questions").select("*"),
    supabase.from("quiz_results").select("*")
  ]);

  const questionsByQuiz = new Map<string, typeof questions>();
  (questions ?? []).forEach((question) => {
    const rows = questionsByQuiz.get(question.quiz_id) ?? [];
    rows.push(question);
    questionsByQuiz.set(question.quiz_id, rows);
  });

  return (
    <AppShell context={context} pendingCount={pendingCount}>
      <PageHeader
        eyebrow="Mini Quiz"
        title="Quiz nhanh"
        description="Giáo viên tạo quiz 5-10 câu; học sinh làm bài và xem điểm ngay sau khi nộp."
      />

      {context.profile.role === "admin" ? (
        <form action={createQuizAction} className="surface mb-6 space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <label className="space-y-1">
              <span className="label">Tiêu đề quiz</span>
              <input name="title" className="field" required />
            </label>
            <label className="space-y-1">
              <span className="label">Thời gian giây</span>
              <input name="time_limit_seconds" type="number" min="60" defaultValue={600} className="field" required />
            </label>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 5 }, (_, index) => {
              const number = index + 1;
              return (
                <fieldset key={number} className="rounded-lg border border-slate-200 p-4">
                  <legend className="px-1 text-sm font-bold text-ink">Câu {number}</legend>
                  <input name={`question_${number}`} className="field mt-2" placeholder="Câu hỏi" required />
                  <div className="mt-3 grid gap-2">
                    {[0, 1, 2, 3].map((option) => (
                      <input
                        key={option}
                        name={`q${number}_option_${option}`}
                        className="field"
                        placeholder={`Đáp án ${option + 1}`}
                        required={option < 2}
                      />
                    ))}
                  </div>
                  <label className="mt-3 block space-y-1">
                    <span className="label">Đáp án đúng</span>
                    <select name={`q${number}_correct`} className="field" defaultValue={0}>
                      {[0, 1, 2, 3].map((option) => (
                        <option key={option} value={option}>
                          Đáp án {option + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                </fieldset>
              );
            })}
          </div>
          <button className="btn-primary">Tạo quiz</button>
        </form>
      ) : null}

      <section className="space-y-5">
        {(quizzes ?? []).map((quiz) => {
          const quizQuestions = questionsByQuiz.get(quiz.id) ?? [];
          const ownResult = (results ?? []).find(
            (result) => result.quiz_id === quiz.id && result.student_id === context.student?.id
          );
          const quizResults = (results ?? []).filter((result) => result.quiz_id === quiz.id);

          return (
            <article key={quiz.id} className="surface p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink">{quiz.title}</h3>
                  <p className="text-xs text-muted">
                    {formatDateVN(quiz.created_at)} · {quizQuestions.length} câu · {quiz.time_limit_seconds}s
                  </p>
                </div>
                {context.profile.role === "admin" ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                    {quizResults.length} lượt nộp
                  </span>
                ) : ownResult ? (
                  <span className="rounded-full bg-lagoon/10 px-3 py-1 text-sm font-bold text-lagoon">
                    Điểm {ownResult.score}
                  </span>
                ) : null}
              </div>

              {context.profile.role === "student" && !ownResult ? (
                <div className="mt-4">
                  <QuizTakeForm
                    quizId={quiz.id}
                    timeLimitSeconds={quiz.time_limit_seconds}
                    questions={quizQuestions.map((question) => ({
                      id: question.id,
                      question: question.question,
                      options: question.options
                    }))}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
        {!quizzes?.length ? <div className="surface p-6 text-center text-muted">Chưa có quiz.</div> : null}
      </section>
    </AppShell>
  );
}
