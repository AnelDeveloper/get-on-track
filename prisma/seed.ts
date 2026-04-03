import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const anel = await prisma.user.upsert({
    where: { email: "anel@getontrack.ba" },
    update: {},
    create: {
      name: "Anel Kujovic",
      email: "anel@getontrack.ba",
      password,
      role: "admin",
      bio: "Fitness trainer & competitor. Helping you build your best physique.",
      avatar: "/images/trainer/1-6.jpeg",
      emailVerifiedAt: new Date(),
    },
  });

  const ensar = await prisma.user.upsert({
    where: { email: "ensar@getontrack.ba" },
    update: {},
    create: {
      name: "Ensar",
      email: "ensar@getontrack.ba",
      password,
      role: "admin",
      bio: "Co-founder @ Get On Track",
      emailVerifiedAt: new Date(),
    },
  });

  console.log("Seeded admin users:");
  console.log(`  ${anel.email} / password123`);
  console.log(`  ${ensar.email} / password123`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
