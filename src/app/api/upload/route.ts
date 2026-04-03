import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "posts";

    if (!file) return jsonError("No file provided", 400);

    const maxSize = type === "avatars" ? 2 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return jsonError(`File too large (max ${type === "avatars" ? "2MB" : "50MB"})`, 400);
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      return jsonError("Invalid file type", 400);
    }

    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", type);

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const isVideo = file.type.startsWith("video/");
    const url = `/uploads/${type}/${filename}`;

    return jsonSuccess({ url, mediaType: isVideo ? "video" : "image" });
  } catch (e) {
    console.error("Upload error:", e);
    return jsonError("Upload failed", 500);
  }
}
