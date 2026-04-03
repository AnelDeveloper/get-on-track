import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const cursor = searchParams.get("cursor") || undefined;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      fromUser: { select: { id: true, name: true, avatar: true } },
      post: { select: { id: true, body: true } },
    },
  });

  return jsonSuccess({
    notifications: notifications.map((n) => ({
      ...n,
      post: { ...n.post, body: n.post.body.substring(0, 100) },
    })),
    nextCursor: notifications.length === limit ? notifications[notifications.length - 1]?.id : null,
  });
}
