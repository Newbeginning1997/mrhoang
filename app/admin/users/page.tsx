import { Trash2 } from "lucide-react";
import {
  createParentAction,
  createStudentAction,
  deleteUserAction,
  resetPasswordAction
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { formatDateVN } from "@/lib/dates";
import { getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function UsersPage() {
  const context = await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const pendingCount = await getPendingHomeworkCount(context);

  const [{ data: profiles }, { data: students }, { data: parents }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("students").select("*"),
    supabase.from("parents").select("*")
  ]);

  const studentByUser = new Map((students ?? []).map((student) => [student.user_id, student]));
  const parentByUser = new Map((parents ?? []).map((parent) => [parent.user_id, parent]));

  return (
    <AppShell context={context} pendingCount={pendingCount}>
      <PageHeader
        eyebrow="Account Management"
        title="Quản lý tài khoản"
        description="Tạo tài khoản học sinh theo mẫu hs_ten_lop và 4 tài khoản phụ huynh dùng chung theo khối."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <form action={createStudentAction} className="surface space-y-4 p-5">
          <h3 className="section-title">Thêm học sinh</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="label">Họ tên</span>
              <input name="full_name" className="field" required />
            </label>
            <label className="space-y-1">
              <span className="label">Username</span>
              <input name="username" className="field" placeholder="hs_nguyenvana_7a" required />
            </label>
            <label className="space-y-1">
              <span className="label">Lớp</span>
              <input name="class_name" className="field" placeholder="7A" required />
            </label>
            <label className="space-y-1">
              <span className="label">Khối</span>
              <select name="grade" className="field" required>
                {[6, 7, 8, 9].map((grade) => (
                  <option key={grade} value={grade}>
                    Khối {grade}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="label">Ngày vào học</span>
              <input name="enrollment_date" type="date" className="field" required />
            </label>
            <label className="space-y-1">
              <span className="label">Mật khẩu</span>
              <input name="password" type="password" className="field" required minLength={6} />
            </label>
          </div>
          <button className="btn-primary">Tạo học sinh</button>
        </form>

        <form action={createParentAction} className="surface space-y-4 p-5">
          <h3 className="section-title">Tạo tài khoản phụ huynh</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="label">Khối</span>
              <select name="grade" className="field" required>
                {[6, 7, 8, 9].map((grade) => (
                  <option key={grade} value={grade}>
                    ph_khoi{grade}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="label">Mật khẩu</span>
              <input name="password" type="password" className="field" required minLength={6} />
            </label>
          </div>
          <button className="btn-secondary">Tạo phụ huynh</button>
        </form>
      </section>

      <section className="mt-6">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Vai trò</th>
                <th>Thông tin</th>
                <th>Ngày tạo</th>
                <th>Reset mật khẩu</th>
                <th>Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles?.map((profile) => {
                const student = studentByUser.get(profile.id);
                const parent = parentByUser.get(profile.id);
                return (
                  <tr key={profile.id}>
                    <td>
                      <p className="font-semibold">{profile.username}</p>
                      <p className="text-xs text-muted">{profile.email}</p>
                    </td>
                    <td>{profile.role}</td>
                    <td>
                      {student ? (
                        <span>
                          {student.full_name} · Lớp {student.class_name}
                        </span>
                      ) : parent ? (
                        <span>Phụ huynh khối {parent.grade}</span>
                      ) : (
                        <span>Giáo viên</span>
                      )}
                    </td>
                    <td>{formatDateVN(profile.created_at)}</td>
                    <td>
                      <form action={resetPasswordAction} className="flex min-w-[220px] gap-2">
                        <input type="hidden" name="user_id" value={profile.id} />
                        <input
                          name="password"
                          type="password"
                          minLength={6}
                          placeholder="Mật khẩu mới"
                          className="field"
                          required
                        />
                        <button className="btn-secondary px-3">Lưu</button>
                      </form>
                    </td>
                    <td>
                      {profile.id === context.profile.id ? (
                        <span className="text-xs text-muted">Đang dùng</span>
                      ) : (
                        <form action={deleteUserAction}>
                          <input type="hidden" name="user_id" value={profile.id} />
                          <button className="btn-danger px-3" aria-label="Xóa tài khoản">
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
