import { Paperclip, Pin, Trash2 } from "lucide-react";
import { createAnnouncementAction, deleteAnnouncementAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireSchoolUser } from "@/lib/auth";
import { formatDateTimeVN } from "@/lib/dates";
import { fileDownloadPath, getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AnnouncementsPage() {
  const context = await requireSchoolUser();
  const supabase = createSupabaseAdminClient();
  const pendingCount = await getPendingHomeworkCount(context);

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <AppShell context={context} pendingCount={pendingCount}>
      <PageHeader
        eyebrow="Announcements"
        title="Thông báo lớp học"
        description="Thông tin mới nhất được ghim lên đầu nếu giáo viên đánh dấu quan trọng."
      />

      {context.profile.role === "admin" ? (
        <form
          action={createAnnouncementAction}
          className="surface mb-6 grid gap-4 p-5 lg:grid-cols-[1fr_1fr_auto]"
          encType="multipart/form-data"
        >
          <label className="space-y-1">
            <span className="label">Tiêu đề</span>
            <input name="title" className="field" required />
          </label>
          <label className="space-y-1">
            <span className="label">Nội dung</span>
            <textarea name="content" rows={3} className="field" required />
          </label>
          <div className="grid gap-3">
            <label className="space-y-1">
              <span className="label">Tệp đính kèm</span>
              <input name="file" type="file" className="field" accept=".pdf,.doc,.docx,image/*" />
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <input name="is_pinned" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
              Ghim thông báo
            </label>
            <button className="btn-primary">Đăng</button>
          </div>
        </form>
      ) : null}

      <section className="space-y-4">
        {announcements?.map((item) => {
          const fileHref = fileDownloadPath(
            process.env.SUPABASE_BUCKET_ANNOUNCEMENTS ?? "announcements",
            item.file_url
          );
          return (
            <article key={item.id} className="surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.is_pinned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sun/10 px-3 py-1 text-xs font-bold text-sun">
                        <Pin className="h-3 w-3" aria-hidden />
                        Đã ghim
                      </span>
                    ) : null}
                    <h3 className="text-lg font-bold text-ink">{item.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted">{formatDateTimeVN(item.created_at)}</p>
                </div>
                {context.profile.role === "admin" ? (
                  <form action={deleteAnnouncementAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="btn-danger px-3" aria-label="Xóa thông báo">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                ) : null}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {item.content}
              </p>
              {fileHref ? (
                <a href={fileHref} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <Paperclip className="h-4 w-4" aria-hidden />
                  Tải tệp đính kèm
                </a>
              ) : null}
            </article>
          );
        })}
        {!announcements?.length ? (
          <div className="surface p-6 text-center text-muted">Chưa có thông báo.</div>
        ) : null}
      </section>
    </AppShell>
  );
}
