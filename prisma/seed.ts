import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Wipe all existing plans — starting fresh for v2
  const deleted = await prisma.plan.deleteMany();
  console.log(`Deleted ${deleted.count} existing plans.`);

  // Ensure the admin user exists
  await prisma.user.upsert({
    where: {
      githubId: "prabaltripathiofficial",
    },
    create: {
      githubId: "prabaltripathiofficial",
      username: "prabaltripathiofficial",
      avatarUrl: "https://github.com/prabaltripathiofficial.png",
    },
    update: {
      avatarUrl: "https://github.com/prabaltripathiofficial.png",
      username: "prabaltripathiofficial",
    },
  });

  console.log("Seed complete. Registry is empty — ready for fresh submissions.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Prisma seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
