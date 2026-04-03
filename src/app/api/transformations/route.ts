import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET() {
  const transformations = await prisma.transformation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return jsonSuccess(transformations);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== "admin") return jsonError("Only admin can add transformations", 403);

  try {
    const { clientName, description, beforeImage, afterImage, duration } = await req.json();

    if (!clientName || !beforeImage || !afterImage) {
      return jsonError("Client name, before and after images are required", 400);
    }

    const transformation = await prisma.transformation.create({
      data: {
        userId: user.id,
        clientName,
        description: description || null,
        beforeImage,
        afterImage,
        duration: duration || null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return jsonSuccess(transformation, 201);
  } catch {
    return jsonError("Failed to create transformation", 500);
  }
}
