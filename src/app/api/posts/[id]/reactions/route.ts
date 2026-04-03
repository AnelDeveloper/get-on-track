import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const reactionFilter = searchParams.get("reaction");

  const where: Record<string, unknown> = { postId: id };
  if (reactionFilter) where.reaction = reactionFilter;

  const likes = await prisma.postLike.findMany({
    where,
    include: { user: { select: { id: true, name: true, avatar: true, bio: true } } },
    orderBy: { createdAt: "desc" },
  });

  const summary: Record<string, number> = {};
  const allLikes = await prisma.postLike.findMany({ where: { postId: id } });
  allLikes.forEach((l) => {
    summary[l.reaction] = (summary[l.reaction] || 0) + 1;
  });

  return jsonSuccess({
    users: likes.map((l) => ({ ...l.user, reaction: l.reaction })),
    summary,
    total: allLikes.length,
  });
}
