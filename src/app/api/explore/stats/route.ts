import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/auth";

export async function GET() {
  const members = await prisma.user.count();
  const posts = await prisma.post.count();

  return jsonSuccess({ members, posts });
}
