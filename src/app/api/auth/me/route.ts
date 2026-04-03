import { prisma } from "@/lib/prisma";
import { getAuthUser, jsonError, jsonSuccess, hashPassword, verifyPassword } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  const postsCount = await prisma.post.count({ where: { userId: user.id } });

  return jsonSuccess({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    postsCount,
    createdAt: user.createdAt,
  });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const { name, email, bio, avatar } = await req.json();

    const data: Record<string, string> = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (bio !== undefined) data.bio = bio;
    if (avatar !== undefined) data.avatar = avatar;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return jsonSuccess({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      avatar: updated.avatar,
      bio: updated.bio,
    });
  } catch {
    return jsonError("Update failed", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const { password } = await req.json();
    if (!password || !user.password) return jsonError("Password required", 400);

    const valid = await verifyPassword(password, user.password);
    if (!valid) return jsonError("Invalid password", 403);

    await prisma.user.delete({ where: { id: user.id } });
    return jsonSuccess({ message: "Account deleted" });
  } catch {
    return jsonError("Deletion failed", 500);
  }
}
