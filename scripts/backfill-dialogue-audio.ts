import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });

import { generateDialogueAudio } from "./dialogue-audio";

const VOICES = {
  Leo: "en-US-GuyNeural",
  Juba: "en-US-AvaNeural",
  default: "en-US-AvaNeural",
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  const { rows } = await pool.query(
    `SELECT id, question FROM challenges WHERE type = 'DIALOGUE' AND audio_src IS NULL ORDER BY id`,
  );

  console.log(`${rows.length} rows to process`);

  for (const row of rows) {
    const audioSrc = await generateDialogueAudio({
      script: row.question,
      voices: VOICES,
    });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`UPDATE challenges SET audio_src = $1 WHERE id = $2`, [audioSrc, row.id]);
      await client.query("COMMIT");
      console.log(`Updated challenge ${row.id} -> ${audioSrc}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  await pool.end();
}

main();
