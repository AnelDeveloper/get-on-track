import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

const VALID_REACTIONS = ["like", "celebrate", "support", "love", "insightful", "funny"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return jsonError("Post not found", 404);

  try {
    const { reaction } = await req.json();
    if (!VALID_REACTIONS.includes(reaction)) {
      return jsonError("Invalid reaction", 400);
    }

    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId: user.id, postId: id } },
    });

    if (existing) {
      if (existing.reaction === reaction) {
        await prisma.postLike.delete({ where: { id: existing.id } });
      } else {
        await prisma.postLike.update({ where: { id: existing.id }, data: { reaction } });
      }
    } else {
      await prisma.postLike.create({
        data: { userId: user.id, postId: id, reaction },
      });

      if (post.userId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: post.userId,
            fromUserId: user.id,
            type: "like",
            reaction,
            postId: id,
          },
        });
      }
    }

    const likes = await prisma.postLike.findMany({ where: { postId: id } });
    const userReaction = likes.find((l) => l.userId === user.id)?.reaction || null;
    const summary: Record<string, number> = {};
    likes.forEach((l) => {
      summary[l.reaction] = (summary[l.reaction] || 0) + 1;
    });

    return jsonSuccess({ userReaction, likesCount: likes.length, reactionsSummary: summary });
  } catch {
    return jsonError("Reaction failed", 500);
  }
}
