import { jsonSuccess } from "@/lib/auth";

export async function POST() {
  return jsonSuccess({ message: "Logged out" });
}
