import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return jsonError("Post not found", 404);

  try {
    const { body, parentId } = await req.json();
    if (!body || body.length > 2000) return jsonError("Body required (max 2000)", 400);

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== id) return jsonError("Parent comment not found", 404);
    }

    const comment = await prisma.comment.create({
      data: { userId: user.id, postId: id, body, parentId: parentId || null },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        replies: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (post.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          fromUserId: user.id,
          type: "comment",
          postId: id,
        },
      });
    }

    return jsonSuccess(comment, 201);
  } catch {
    return jsonError("Failed to create comment", 500);
  }
}
