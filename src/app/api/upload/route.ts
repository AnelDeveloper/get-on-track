import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const IS_VERCEL = process.env.VERCEL === "1";

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
    const filename = `${type}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const isVideo = file.type.startsWith("video/");

    if (IS_VERCEL) {
      // Vercel: use Blob storage
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });
      return jsonSuccess({ url: blob.url, mediaType: isVideo ? "video" : "image" });
    } else {
      // Local dev: write to public/uploads/
      const uploadDir = path.join(process.cwd(), "public", "uploads", type);
      await mkdir(uploadDir, { recursive: true });
      const localFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = path.join(uploadDir, localFilename);
      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));
      const url = `/uploads/${type}/${localFilename}`;
      return jsonSuccess({ url, mediaType: isVideo ? "video" : "image" });
    }
  } catch (e) {
    console.error("Upload error:", e);
    return jsonError("Upload failed", 500);
  }
}
