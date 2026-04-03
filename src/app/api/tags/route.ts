import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const tags = await prisma.tag.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : {},
    include: { _count: { select: { posts: true } } },
    orderBy: { posts: { _count: "desc" } },
    take: 20,
  });

  return jsonSuccess(tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    postsCount: t._count.posts,
  })));
}
