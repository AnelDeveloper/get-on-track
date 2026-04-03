import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET() {
  const photos = await prisma.galleryPhoto.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return jsonSuccess(photos);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "admin") return jsonError("Forbidden", 403);

  try {
    const { image, caption, isHero, sortOrder } = await req.json();
    if (!image) return jsonError("Image is required", 400);

    const photo = await prisma.galleryPhoto.create({
      data: {
        image,
        caption: caption || null,
        isHero: isHero ?? false,
        sortOrder: sortOrder ?? 0,
      },
    });

    return jsonSuccess(photo, 201);
  } catch {
    return jsonError("Failed to add photo", 500);
  }
}
