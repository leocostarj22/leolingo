import fs from "fs";
import path from "path";
import { EdgeTTS } from "node-edge-tts";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateAudio = async (items: { slug: string; text: string }[]) => {
  const tts = new EdgeTTS({ voice: "en-US-AvaNeural", lang: "en-US" });

  for (const item of items) {
    const filePath = path.join(AUDIO_DIR, `${item.slug}.mp3`);

    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      console.log(`Skipping ${item.slug} (already exists)`);
      continue;
    }

    console.log(`Generating ${item.slug}...`);

    for (let attempt = 1; ; attempt++) {
      try {
        await tts.ttsPromise(item.text, filePath);
        break;
      } catch (error) {
        if (attempt >= 5) throw error;
        console.log(`  retrying ${item.slug} (attempt ${attempt}) after rate limit...`);
        await sleep(attempt * 2000);
      }
    }

    await sleep(400);
  }
};
