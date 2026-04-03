import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const count = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return jsonSuccess({ count });
}
