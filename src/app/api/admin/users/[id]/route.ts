import { prisma } from "@/lib/prisma";
import { getAuthUser, hashPassword, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user || user.role !== "admin") return jsonError("Forbidden", 403);

  try {
    const { name, email, role, bio, password } = await req.json();
    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (role) data.role = role;
    if (bio !== undefined) data.bio = bio;
    if (password) data.password = await hashPassword(password);

    const updated = await prisma.user.update({ where: { id }, data });

    return jsonSuccess({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    });
  } catch {
    return jsonError("Update failed", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user || user.role !== "admin") return jsonError("Forbidden", 403);
  if (user.id === id) return jsonError("Cannot delete yourself", 422);

  await prisma.user.delete({ where: { id } });
  return jsonSuccess({ message: "User deleted" });
}
