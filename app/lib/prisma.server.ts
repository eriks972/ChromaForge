import { createRequire } from "node:module";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";

const require = createRequire(import.meta.url);

// ⬇️ THIS is the critical fix
const { PrismaClient } = require("../../prisma/generated");

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});
