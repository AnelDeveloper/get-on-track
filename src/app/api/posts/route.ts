import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const tag = searchParams.get("tag") || "";
  const mine = searchParams.get("mine") === "true";
  const limit = parseInt(searchParams.get("limit") || "20");
  const cursor = searchParams.get("cursor") || undefined;

  const where: Record<string, unknown> = {};

  if (mine) where.userId = user.id;

  if (search) {
    where.OR = [
      { body: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (tag) {
    where.tags = { some: { tag: { slug: tag } } };
  }

  const posts = await prisma.post.findMany({
    where,
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
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

  const formatted = posts.map((post) => {
    const userReaction = post.likes.find((l) => l.userId === user.id);
    const reactionSummary: Record<string, number> = {};
    post.likes.forEach((l) => {
      reactionSummary[l.reaction] = (reactionSummary[l.reaction] || 0) + 1;
    });

    return {
      ...post,
      likes: undefined,
      userReaction: userReaction?.reaction || null,
      reactionsSummary: reactionSummary,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      tags: post.tags.map((t) => t.tag),
    };
  });

  return jsonSuccess({
    posts: formatted,
    nextCursor: posts.length === limit ? posts[posts.length - 1]?.id : null,
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const { body, tags, image, mediaType } = await req.json();

    if (!body || body.length > 5000) {
      return jsonError("Body is required (max 5000 chars)", 400);
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        body,
        image: image || null,
        mediaType: mediaType || null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, bio: true } },
      },
    });

    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags.slice(0, 5)) {
        const slug = slugify(tagName);
        if (!slug) continue;

        const tag = await prisma.tag.upsert({
          where: { slug },
          update: {},
          create: { name: tagName.trim(), slug },
        });

        await prisma.postTag.create({
          data: { postId: post.id, tagId: tag.id },
        });
      }
    }

    return jsonSuccess(post, 201);
  } catch {
    return jsonError("Failed to create post", 500);
  }
}
