import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  await pool.query(`ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'SPEAK';`);
  console.log("OK");
  await pool.end();
}

main();
