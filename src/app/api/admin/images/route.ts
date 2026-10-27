import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

const BUCKET = "question-images";
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };

/** Stores an image pasted into the question editor and returns the public URL used in the flashcard text. */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    const extension = EXTENSIONS[file.type];
    if (!extension) return NextResponse.json({ error: "Images must be PNG, JPEG, GIF or WebP." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Images must be 5 MB or smaller." }, { status: 400 });

    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const { error } = await auth.admin.storage.from(BUCKET).upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (error) throw error;
    const { data } = auth.admin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json({ error: "The image could not be uploaded. Check the question-images storage bucket exists (see the storage migration)." }, { status: 500 });
  }
}
