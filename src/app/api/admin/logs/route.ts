import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "admin") return jsonError("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const action = searchParams.get("action") || "";
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};

  if (action) where.action = action;
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { action: { contains: search, mode: "insensitive" } },
      { ipAddress: { contains: search } },
    ];
  }

  const logs = await prisma.activityLog.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return jsonSuccess(logs);
}
