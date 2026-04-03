import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const cursor = searchParams.get("cursor") || undefined;

  const posts = await prisma.post.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatar: true, bio: true } },
      tags: { include: { tag: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  return jsonSuccess({
    posts: posts.map((p) => ({
      ...p,
      tags: p.tags.map((t) => t.tag),
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
    })),
    nextCursor: posts.length === limit ? posts[posts.length - 1]?.id : null,
  });
}
