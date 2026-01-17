import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function test() {
  const res = await pool.query("SELECT 1");
  console.log("DB OK:", res.rows);
  await pool.end();
}

test().catch(console.error);
