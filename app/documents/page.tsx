import { Download, FileText, Trash2 } from "lucide-react";
import { createDocumentAction, deleteDocumentAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireSchoolUser } from "@/lib/auth";
import { formatDateVN } from "@/lib/dates";
import { bytesToLabel, fileDownloadPath, getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const categories = [
  { key: "resource", label: "Tài liệu bổ ích", en: "Resources" },
  { key: "exam", label: "Đề thi", en: "Exam papers" },
  { key: "quiz", label: "Đề kiểm tra", en: "Tests" }
];

export default async function DocumentsPage() {
  const context = await requireSchoolUser();
  const supabase = createSupabaseAdminClient();
  const pendingCount = await getPendingHomeworkCount(context);

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AppShell context={context} pendingCount={pendingCount}>
      <PageHeader
        eyebrow="Documents"
        title="Tài liệu và đề thi"
        description="Tệp PDF, DOCX và hình ảnh được chia theo danh mục để học sinh tải về."
      />

      {context.profile.role === "admin" ? (
        <form
          action={createDocumentAction}
          className="surface mb-6 grid gap-4 p-5 md:grid-cols-[1fr_220px_1fr_auto]"
          encType="multipart/form-data"
        >
          <label className="space-y-1">
            <span className="label">Tiêu đề</span>
            <input name="title" className="field" required />
          </label>
          <label className="space-y-1">
            <span className="label">Danh mục</span>
            <select name="category" className="field" required>
              {categories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="label">Tệp</span>
            <input name="file" type="file" className="field" accept=".pdf,.doc,.docx,image/*" required />
          </label>
          <button className="btn-primary self-end">Tải lên</button>
        </form>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        {categories.map((category) => {
          const rows = (documents ?? []).filter((document) => document.category === category.key);
          return (
            <div key={category.key} className="surface p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-bold text-ink">{category.label}</h3>
                  <p className="text-xs text-muted">{category.en}</p>
                </div>
              </div>
              <div className="space-y-3">
                {rows.map((document) => {
                  const href = fileDownloadPath(
                    process.env.SUPABASE_BUCKET_DOCUMENTS ?? "documents",
                    document.file_url
                  );
                  return (
                    <div key={document.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{document.title}</p>
                          <p className="mt-1 text-xs text-muted">
                            {formatDateVN(document.created_at)} · {bytesToLabel(document.file_size)}
                          </p>
                        </div>
                        {context.profile.role === "admin" ? (
                          <form action={deleteDocumentAction}>
                            <input type="hidden" name="id" value={document.id} />
                            <button className="text-rose" aria-label="Xóa tài liệu">
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </form>
                        ) : null}
                      </div>
                      {href ? (
                        <a href={href} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                          <Download className="h-4 w-4" aria-hidden />
                          Tải xuống
                        </a>
                      ) : null}
                    </div>
                  );
                })}
                {!rows.length ? <p className="text-sm text-muted">Chưa có tệp.</p> : null}
              </div>
            </div>
          );
        })}
      </section>
    </AppShell>
  );
}
