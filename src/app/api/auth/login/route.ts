import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return jsonError("Email and password are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return jsonError("Invalid credentials", 401);
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return jsonError("Invalid credentials", 401);
    }

    const token = signToken(user.id);

    return jsonSuccess({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio },
      token,
    });
  } catch (e) {
    console.error("Login error:", e);
    return jsonError("Login failed", 500);
  }
}
