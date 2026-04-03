import { getAuthUser, hashPassword, verifyPassword, jsonError, jsonSuccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Unauthorized", 401);
  if (!user.password) return jsonError("Cannot change password for OAuth accounts", 400);

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return jsonError("Both passwords required", 400);
    if (newPassword.length < 6) return jsonError("Password must be at least 6 characters", 400);

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) return jsonError("Current password is incorrect", 403);

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return jsonSuccess({ message: "Password updated" });
  } catch {
    return jsonError("Password change failed", 500);
  }
}
