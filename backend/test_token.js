import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { isVerified: false, verificationToken: { not: null } },
  });

  if (user) {
    console.log("Test Verification Token found:", user.verificationToken);
  } else {
    // If none exists, create a dummy one for testing
    console.log("No unverified users found. Creating a test one...");
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const newUser = await prisma.user.create({
      data: {
        email: `test_unverified_${Date.now()}@example.com`,
        passwordHash: "dummy",
        isVerified: false,
        verificationToken: token,
      },
    });
    console.log("Test Verification Token created:", newUser.verificationToken);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
