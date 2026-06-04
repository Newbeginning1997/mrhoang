# Mr Hoàng English Class Management

Ứng dụng quản lý lớp tiếng Anh cho khoảng 100 học sinh khối 6-9. UI dùng tiếng Việt là chính, English secondary labels khi phù hợp.

## Tech stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage, Row Level Security
- Recharts
- Netlify deployment with `@netlify/plugin-nextjs`

## Chức năng chính

- Admin dashboard, quản lý tài khoản học sinh/phụ huynh, thông báo, bài tập, tài liệu, điểm số, thống kê, lịch và quiz.
- Học sinh xem thông báo, bài tập, tài liệu, lịch, quiz, điểm của mình, huy hiệu và nhận xét.
- Phụ huynh đăng nhập riêng tại `/parents`, chỉ xem học sinh cùng khối trong `/parents/dashboard`.
- Badge tự động đồng bộ sau khi nhập điểm hoặc nộp/chấm bài.
- Upload file PDF, DOC/DOCX và ảnh, giới hạn 10MB.

## Cài đặt local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Trên Windows PowerShell nếu `npm` bị chặn bởi execution policy, dùng:

```bash
npm.cmd install
npm.cmd run dev
```

Nếu đang ở thư mục khác như `C:\Users\Admin`, chạy bằng launcher:

```cmd
"C:\Users\Admin\Documents\Mr Hoang\start-dev.cmd"
```

## Supabase setup

1. Tạo project Supabase.
2. Mở SQL Editor và chạy migration trong `supabase/migrations/20260603000000_init.sql`.
3. Copy Project URL và anon key vào `.env.local`.
4. Copy service role key vào `SUPABASE_SERVICE_ROLE_KEY`. Key này chỉ dùng server-side để tạo account và upload file.

## Tạo admin đầu tiên

1. Trong Supabase Dashboard, vào Authentication → Users → Add user.
2. Tạo email, ví dụ `admin@mrhoang.local`, đặt mật khẩu và đánh dấu email confirmed.
3. Lấy `User UID` vừa tạo.
4. Chạy SQL sau, thay UID/email nếu khác:

```sql
insert into public.profiles (id, email, username, role)
values ('USER_UID_HERE', 'admin@mrhoang.local', 'admin', 'admin');
```

Sau đó đăng nhập tại `/login` bằng username `admin` và mật khẩu đã đặt.

## Tạo tài khoản

- Học sinh: admin tạo ở `/admin/users`, username nên theo mẫu `hs_<tenkhongdau>_<lop>`, ví dụ `hs_nguyenvana_7a`.
- Phụ huynh: admin tạo 4 tài khoản theo khối, app tự sinh username `ph_khoi6`, `ph_khoi7`, `ph_khoi8`, `ph_khoi9`.
- Password được tạo/reset bởi admin, không có self-registration.

## CSV import điểm

Vào `/scores`, chọn bài kiểm tra rồi nhập CSV:

```csv
hs_nguyenvana_7a,8.5
hs_tranthingoc_8b,9
```

## Deploy Netlify

1. Push source code lên GitHub/GitLab.
2. Tạo site mới trên Netlify từ repository.
3. Netlify sẽ đọc `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Plugin: `@netlify/plugin-nextjs`
4. Thêm environment variables trong Netlify:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_EMAIL_DOMAIN`
   - Các bucket env nếu đổi tên bucket
5. Deploy.

## Bảo mật

- Middleware tách route admin/student/parent.
- RLS trong Supabase enforce lại quyền đọc/ghi ở database.
- Parent route bị giới hạn ở `/parents/dashboard`; không có nav tới bài tập, tài liệu hoặc thông báo.
- Student chỉ đọc điểm, comments, badges và submissions của chính mình.
- File tải qua `/api/files/...`, route này chặn parent và tạo signed URL ngắn hạn.

## Ghi chú v1

- Password hash do Supabase Auth quản lý, bảng app dùng `profiles` thay cho bảng `users.password_hash`.
- Parent dashboard có lịch chung loại exam/holiday/special, không hiển thị nội dung bài tập/tài liệu/thông báo.
- Server actions hiện trả lỗi qua error boundary mặc định của Next.js; có thể nâng cấp bằng toast/form state sau.
