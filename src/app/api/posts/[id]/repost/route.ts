import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return jsonError("Post not found", 404);

  const existing = await prisma.post.findFirst({
    where: { userId: user.id, repostId: id },
  });
  if (existing) return jsonError("Already reposted", 409);

  try {
    const { body } = await req.json().catch(() => ({ body: "" }));

    const repost = await prisma.post.create({
      data: {
        userId: user.id,
        body: body || "",
        repostId: id,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        originalPost: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (post.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          fromUserId: user.id,
          type: "repost",
          postId: id,
        },
      });
    }

    return jsonSuccess(repost, 201);
  } catch {
    return jsonError("Repost failed", 500);
  }
}
