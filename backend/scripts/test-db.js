import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  try {
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Current user count: ${userCount}`);
  } catch (e) {
    console.error("Connection failed:", e);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
