import { prisma } from "@/lib/prisma";
import { getAuthUser, hashPassword, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "admin") return jsonError("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "20");

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {},
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });

  return jsonSuccess(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      bio: u.bio,
      postsCount: u._count.posts,
      createdAt: u.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "admin") return jsonError("Forbidden", 403);

  try {
    const { name, email, password, role, bio } = await req.json();
    if (!name || !email || !password) return jsonError("Name, email, password required", 400);

    const hashed = await hashPassword(password);
    const created = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role || "user",
        bio: bio || null,
        emailVerifiedAt: new Date(),
      },
    });

    return jsonSuccess({
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
    }, 201);
  } catch {
    return jsonError("Failed to create user", 500);
  }
}
