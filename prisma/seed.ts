import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  host: "127.0.0.1",
  port: 5432,
  user: "postgres",
  password: "1234",
  database: "fitness_app",
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "anel@getontrack.com" },
    update: {},
    create: {
      name: "Anel Kujovic",
      email: "anel@getontrack.com",
      password,
      role: "admin",
      bio: "Fitness trainer & competitor. Helping you build your best physique.",
      avatar: "/images/trainer/1-6.jpeg",
      emailVerifiedAt: new Date(),
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: "demo@getontrack.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@getontrack.com",
      password,
      role: "user",
      bio: "Just starting my fitness journey!",
      emailVerifiedAt: new Date(),
    },
  });

  console.log("Seeded users:");
  console.log(`  Admin: ${admin.email} / password123`);
  console.log(`  User:  ${user1.email} / password123`);
}

main()
  .then(async () => { await prisma.$disconnect(); await pool.end(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
