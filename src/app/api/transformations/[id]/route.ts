import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== "admin") return jsonError("Forbidden", 403);

  const transformation = await prisma.transformation.findUnique({ where: { id } });
  if (!transformation) return jsonError("Transformation not found", 404);

  await prisma.transformation.delete({ where: { id } });
  return jsonSuccess({ message: "Transformation deleted" });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== "admin") return jsonError("Forbidden", 403);

  try {
    const { clientName, description, beforeImage, afterImage, duration } = await req.json();
    const data: Record<string, unknown> = {};
    if (clientName) data.clientName = clientName;
    if (description !== undefined) data.description = description;
    if (beforeImage) data.beforeImage = beforeImage;
    if (afterImage) data.afterImage = afterImage;
    if (duration !== undefined) data.duration = duration;

    const updated = await prisma.transformation.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    return jsonSuccess(updated);
  } catch {
    return jsonError("Update failed", 500);
  }
}
