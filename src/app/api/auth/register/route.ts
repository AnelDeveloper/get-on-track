import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, jsonError, jsonSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return jsonError("Name, email and password are required", 400);
    }

    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("Email already registered", 409);
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerifiedAt: new Date(),
      },
    });

    const token = signToken(user.id);

    return jsonSuccess({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio },
      token,
    }, 201);
  } catch {
    return jsonError("Registration failed", 500);
  }
}
