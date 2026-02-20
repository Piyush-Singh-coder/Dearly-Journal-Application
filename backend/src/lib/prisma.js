import { PrismaClient } from "@prisma/client";

// Singleton pattern to prevent multiple PrismaClient instances
const prisma = new PrismaClient();

export default prisma;
