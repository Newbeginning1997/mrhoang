import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const maxBytes = 10 * 1024 * 1024;

export function hasUpload(file: File | null) {
  return Boolean(file && file.size > 0);
}

export function validateUpload(file: File) {
  if (file.size > maxBytes) {
    throw new Error("Tệp tải lên tối đa 10MB.");
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Chỉ hỗ trợ PDF, DOCX/DOC và hình ảnh.");
  }
}

export function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function uploadFormFile({
  bucket,
  file,
  folder
}: {
  bucket: string;
  file: File | null;
  folder: string;
}) {
  if (!hasUpload(file)) return null;

  validateUpload(file!);

  const supabase = createSupabaseAdminClient();
  const safeName = sanitizeFileName(file!.name);
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file!, {
    contentType: file!.type,
    upsert: false
  });

  if (error) throw new Error(error.message);
  return path;
}

export async function signedFileUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}
