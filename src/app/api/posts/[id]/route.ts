import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatar: true, bio: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      },
      tags: { include: { tag: true } },
      likes: true,
      originalPost: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
      _count: { select: { comments: true, likes: true } },
    },
  });

  if (!post) return jsonError("Post not found", 404);

  const userReaction = user ? post.likes.find((l) => l.userId === user.id)?.reaction : null;
  const reactionSummary: Record<string, number> = {};
  post.likes.forEach((l) => {
    reactionSummary[l.reaction] = (reactionSummary[l.reaction] || 0) + 1;
  });

  return jsonSuccess({
    ...post,
    likes: undefined,
    userReaction,
    reactionsSummary: reactionSummary,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    tags: post.tags.map((t) => t.tag),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return jsonError("Post not found", 404);
  if (post.userId !== user.id) return jsonError("Forbidden", 403);

  try {
    const { body } = await req.json();
    if (!body || body.length > 5000) return jsonError("Body is required (max 5000)", 400);

    const updated = await prisma.post.update({
      where: { id },
      data: { body },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    return jsonSuccess(updated);
  } catch {
    return jsonError("Update failed", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return jsonError("Post not found", 404);
  if (post.userId !== user.id && user.role !== "admin") return jsonError("Forbidden", 403);

  await prisma.post.delete({ where: { id } });
  return jsonSuccess({ message: "Post deleted" });
}
