import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params;
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return jsonError("Comment not found", 404);
  if (comment.userId !== user.id && user.role !== "admin") return jsonError("Forbidden", 403);

  await prisma.comment.delete({ where: { id: commentId } });
  return jsonSuccess({ message: "Comment deleted" });
}
