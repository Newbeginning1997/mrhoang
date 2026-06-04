"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminAction, assertStudentAction } from "@/lib/auth";
import { syncBadgesForStudent } from "@/lib/badges";
import { uploadFormFile } from "@/lib/files";
import { initialsFromName } from "@/lib/metrics";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Grade, Role } from "@/lib/types";

const appEmailDomain = process.env.NEXT_PUBLIC_APP_EMAIL_DOMAIN ?? "mrhoang.local";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length ? value : null;
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function gradeValue(formData: FormData, key = "grade") {
  const grade = Number(formData.get(key));
  if (![6, 7, 8, 9].includes(grade)) {
    throw new Error("Khối học không hợp lệ.");
  }
  return grade as Grade;
}

function roleEmail(username: string) {
  return `${username.toLowerCase()}@${appEmailDomain}`;
}

function fileValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File ? value : null;
}

async function createAuthProfile({
  username,
  password,
  role
}: {
  username: string;
  password: string;
  role: Role;
}) {
  const admin = createSupabaseAdminClient();
  const email = roleEmail(username);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, role }
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Không tạo được tài khoản.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    email,
    username,
    role
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(profileError.message);
  }

  return data.user.id;
}

export async function createStudentAction(formData: FormData) {
  await assertAdminAction();

  const username = text(formData, "username").toLowerCase();
  const password = text(formData, "password");
  const fullName = text(formData, "full_name");
  const className = text(formData, "class_name").toUpperCase();
  const grade = gradeValue(formData);
  const enrollmentDate = text(formData, "enrollment_date");

  if (!username.startsWith("hs_")) throw new Error("Username học sinh phải bắt đầu bằng hs_.");
  if (!password || password.length < 6) throw new Error("Mật khẩu cần ít nhất 6 ký tự.");
  if (!fullName || !className || !enrollmentDate) throw new Error("Vui lòng điền đủ thông tin học sinh.");

  const userId = await createAuthProfile({ username, password, role: "student" });
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("students").insert({
    user_id: userId,
    full_name: fullName,
    class_name: className,
    grade,
    enrollment_date: enrollmentDate,
    avatar_initials: initialsFromName(fullName)
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function createParentAction(formData: FormData) {
  await assertAdminAction();

  const grade = gradeValue(formData);
  const username = `ph_khoi${grade}`;
  const password = text(formData, "password");

  if (!password || password.length < 6) throw new Error("Mật khẩu cần ít nhất 6 ký tự.");

  const userId = await createAuthProfile({ username, password, role: "parent" });
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("parents").insert({
    user_id: userId,
    grade
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function resetPasswordAction(formData: FormData) {
  await assertAdminAction();
  const userId = text(formData, "user_id");
  const password = text(formData, "password");
  if (!password || password.length < 6) throw new Error("Mật khẩu cần ít nhất 6 ký tự.");

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  const context = await assertAdminAction();
  const userId = text(formData, "user_id");
  if (userId === context.profile.id) throw new Error("Không thể xóa tài khoản đang đăng nhập.");

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function createAnnouncementAction(formData: FormData) {
  const context = await assertAdminAction();
  const fileUrl = await uploadFormFile({
    bucket: process.env.SUPABASE_BUCKET_ANNOUNCEMENTS ?? "announcements",
    file: fileValue(formData, "file"),
    folder: "announcements"
  });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("announcements").insert({
    title: text(formData, "title"),
    content: text(formData, "content"),
    is_pinned: formData.get("is_pinned") === "on",
    file_url: fileUrl,
    created_by: context.profile.id
  });

  if (error) throw new Error(error.message);
  revalidatePath("/announcements");
  revalidatePath("/admin");
}

export async function deleteAnnouncementAction(formData: FormData) {
  await assertAdminAction();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("announcements").delete().eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/announcements");
}

export async function createHomeworkAction(formData: FormData) {
  const context = await assertAdminAction();
  const fileUrl = await uploadFormFile({
    bucket: process.env.SUPABASE_BUCKET_HOMEWORK ?? "homework",
    file: fileValue(formData, "file"),
    folder: "homework"
  });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("homework").insert({
    title: text(formData, "title"),
    description: text(formData, "description"),
    due_date: text(formData, "due_date"),
    file_url: fileUrl,
    created_by: context.profile.id
  });

  if (error) throw new Error(error.message);
  revalidatePath("/homework");
  revalidatePath("/admin");
}

export async function submitHomeworkAction(formData: FormData) {
  const context = await assertStudentAction();
  const fileUrl = await uploadFormFile({
    bucket: process.env.SUPABASE_BUCKET_SUBMISSIONS ?? "homework-submissions",
    file: fileValue(formData, "file"),
    folder: context.student!.id
  });

  const supabase = createSupabaseAdminClient();
  const payload = {
    homework_id: text(formData, "homework_id"),
    student_id: context.student!.id,
    content: nullableText(formData, "content"),
    submitted_at: new Date().toISOString(),
    ...(fileUrl ? { file_url: fileUrl } : {})
  };

  const { error } = await supabase
    .from("homework_submissions")
    .upsert(payload, { onConflict: "homework_id,student_id" });

  if (error) throw new Error(error.message);
  await syncBadgesForStudent(context.student!.id);
  revalidatePath("/homework");
  revalidatePath("/student");
}

export async function gradeHomeworkAction(formData: FormData) {
  await assertAdminAction();
  const submissionId = text(formData, "submission_id");
  const studentId = text(formData, "student_id");
  const score = numberValue(formData, "score", 0);

  if (score < 0 || score > 10) throw new Error("Điểm bài tập phải từ 0 đến 10.");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("homework_submissions")
    .update({
      score,
      feedback: nullableText(formData, "feedback")
    })
    .eq("id", submissionId);

  if (error) throw new Error(error.message);
  await syncBadgesForStudent(studentId);
  revalidatePath("/homework");
  revalidatePath("/admin");
}

export async function createDocumentAction(formData: FormData) {
  const context = await assertAdminAction();
  const category = text(formData, "category");
  if (!["resource", "exam", "quiz"].includes(category)) throw new Error("Danh mục tài liệu không hợp lệ.");

  const file = fileValue(formData, "file");
  if (!file || file.size === 0) throw new Error("Vui lòng chọn tệp tài liệu.");

  const fileUrl = await uploadFormFile({
    bucket: process.env.SUPABASE_BUCKET_DOCUMENTS ?? "documents",
    file,
    folder: category
  });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("documents").insert({
    title: text(formData, "title"),
    category,
    file_url: fileUrl,
    file_size: file.size,
    uploaded_by: context.profile.id
  });

  if (error) throw new Error(error.message);
  revalidatePath("/documents");
}

export async function deleteDocumentAction(formData: FormData) {
  await assertAdminAction();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("documents").delete().eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/documents");
}

export async function createExamAction(formData: FormData) {
  const context = await assertAdminAction();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("exams").insert({
    title: text(formData, "title"),
    date: text(formData, "date"),
    max_score: numberValue(formData, "max_score", 10),
    created_by: context.profile.id
  });

  if (error) throw new Error(error.message);
  revalidatePath("/scores");
  revalidatePath("/statistics");
}

export async function upsertScoreAction(formData: FormData) {
  const context = await assertAdminAction();
  const studentId = text(formData, "student_id");
  const score = numberValue(formData, "score", 0);

  if (score < 0 || score > 10) throw new Error("Điểm phải từ 0 đến 10.");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("scores").upsert(
    {
      exam_id: text(formData, "exam_id"),
      student_id: studentId,
      score,
      entered_by: context.profile.id
    },
    { onConflict: "exam_id,student_id" }
  );

  if (error) throw new Error(error.message);
  await syncBadgesForStudent(studentId);
  revalidatePath("/scores");
  revalidatePath(`/scores/${studentId}`);
  revalidatePath("/statistics");
}

export async function importScoresCsvAction(formData: FormData) {
  const context = await assertAdminAction();
  const examId = text(formData, "exam_id");
  const csv = text(formData, "csv");
  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));

  const admin = createSupabaseAdminClient();
  const [{ data: students }, { data: profiles }] = await Promise.all([
    admin.from("students").select("id,user_id").order("full_name"),
    admin.from("profiles").select("id,username")
  ]);

  const usernameByUser = new Map((profiles ?? []).map((profile) => [profile.id, profile.username]));
  const byUsername = new Map(
    (students ?? []).map((student) => [usernameByUser.get(student.user_id), student.id])
  );

  const payload = rows
    .map(([username, scoreText]) => ({
      exam_id: examId,
      student_id: byUsername.get(username),
      score: Number(scoreText),
      entered_by: context.profile.id
    }))
    .filter((row) => row.student_id && Number.isFinite(row.score) && row.score >= 0 && row.score <= 10);

  if (!payload.length) throw new Error("CSV cần có dòng dạng username,score.");

  const { error } = await admin.from("scores").upsert(payload, {
    onConflict: "exam_id,student_id"
  });
  if (error) throw new Error(error.message);

  await Promise.all(payload.map((row) => syncBadgesForStudent(row.student_id!)));
  revalidatePath("/scores");
  revalidatePath("/statistics");
}

export async function createTeacherCommentAction(formData: FormData) {
  const context = await assertAdminAction();
  const studentId = text(formData, "student_id");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("teacher_comments").insert({
    student_id: studentId,
    content: text(formData, "content"),
    created_by: context.profile.id
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/scores/${studentId}`);
  revalidatePath("/parents/dashboard");
}

export async function createCalendarEventAction(formData: FormData) {
  const context = await assertAdminAction();
  const eventType = text(formData, "type");
  if (!["exam", "holiday", "homework", "special"].includes(eventType)) {
    throw new Error("Loại sự kiện không hợp lệ.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("calendar_events").insert({
    title: text(formData, "title"),
    date: text(formData, "date"),
    type: eventType,
    created_by: context.profile.id
  });

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function deleteCalendarEventAction(formData: FormData) {
  await assertAdminAction();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function createQuizAction(formData: FormData) {
  const context = await assertAdminAction();
  const admin = createSupabaseAdminClient();

  const questions = Array.from({ length: 10 })
    .map((_, index) => {
      const number = index + 1;
      const question = text(formData, `question_${number}`);
      const options = [0, 1, 2, 3]
        .map((optionIndex) => text(formData, `q${number}_option_${optionIndex}`))
        .filter(Boolean);
      const correctIndex = Number(formData.get(`q${number}_correct`));
      return { question, options, correct_index: correctIndex };
    })
    .filter((row) => row.question && row.options.length >= 2 && Number.isInteger(row.correct_index));

  if (questions.length < 5) throw new Error("Quiz cần ít nhất 5 câu hợp lệ.");

  const { data: quiz, error } = await admin
    .from("quiz")
    .insert({
      title: text(formData, "title"),
      time_limit_seconds: numberValue(formData, "time_limit_seconds", 600),
      created_by: context.profile.id
    })
    .select("id")
    .single();

  if (error || !quiz) throw new Error(error?.message ?? "Không tạo được quiz.");

  const { error: questionError } = await admin.from("quiz_questions").insert(
    questions.map((row) => ({
      quiz_id: quiz.id,
      question: row.question,
      options: row.options,
      correct_index: row.correct_index
    }))
  );

  if (questionError) throw new Error(questionError.message);
  revalidatePath("/quiz");
}

export async function submitQuizAction(formData: FormData) {
  const context = await assertStudentAction();
  const quizId = text(formData, "quiz_id");
  const supabase = createSupabaseAdminClient();
  const { data: questions, error } = await supabase
    .from("quiz_questions")
    .select("id, correct_index")
    .eq("quiz_id", quizId);

  if (error) throw new Error(error.message);
  if (!questions?.length) throw new Error("Quiz chưa có câu hỏi.");

  const correct = questions.filter((question) => {
    const answer = Number(formData.get(`answer_${question.id}`));
    return answer === question.correct_index;
  }).length;
  const score = Number(((correct / questions.length) * 10).toFixed(2));

  const { error: resultError } = await supabase.from("quiz_results").upsert(
    {
      quiz_id: quizId,
      student_id: context.student!.id,
      score,
      submitted_at: new Date().toISOString()
    },
    { onConflict: "quiz_id,student_id" }
  );

  if (resultError) throw new Error(resultError.message);
  revalidatePath("/quiz");
  redirect("/quiz");
}
