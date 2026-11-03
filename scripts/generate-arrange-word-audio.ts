import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";

import * as schema from "../db/schema";
import { slugifyWord } from "../lib/utils";
import { generateAudio } from "./generate-audio";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

const main = async () => {
  const rows = await db
    .select({ text: schema.challengeOptions.text })
    .from(schema.challengeOptions)
    .innerJoin(schema.challenges, eq(schema.challengeOptions.challengeId, schema.challenges.id))
    .where(eq(schema.challenges.type, "ARRANGE"));

  const uniqueWords = new Map<string, string>();
  for (const row of rows) {
    const slug = slugifyWord(row.text);
    if (slug) uniqueWords.set(slug, row.text);
  }

  console.log(`Found ${uniqueWords.size} unique ARRANGE words.`);

  await generateAudio(
    Array.from(uniqueWords, ([slug, text]) => ({ slug: `words/${slug}`, text })),
  );

  await pool.end();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
