import "dotenv/config";
import { PrismaClient } from '../prisma/generated';
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  await prisma.palette.create({
    data: {
      name: "Starter Palette",
      colors: {
        create: [
          { name: "Primary Blue", hex: "#1E40AF" },
          { name: "Accent Teal", hex: "#14B8A6" },
          { name: "Neutral Gray", hex: "#64748B" },
        ],
      },
    },
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });