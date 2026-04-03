import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user || user.role !== "admin") return jsonError("Forbidden", 403);

  try {
    const { image, caption, isHero, sortOrder } = await req.json();
    const data: Record<string, unknown> = {};
    if (image !== undefined) data.image = image;
    if (caption !== undefined) data.caption = caption;
    if (isHero !== undefined) data.isHero = isHero;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const photo = await prisma.galleryPhoto.update({ where: { id }, data });
    return jsonSuccess(photo);
  } catch {
    return jsonError("Update failed", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user || user.role !== "admin") return jsonError("Forbidden", 403);

  await prisma.galleryPhoto.delete({ where: { id } });
  return jsonSuccess({ message: "Photo deleted" });
}
