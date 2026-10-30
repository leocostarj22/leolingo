import fs from "fs";
import path from "path";
import { EdgeTTS } from "node-edge-tts";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

export const generateAudio = async (items: { slug: string; text: string }[]) => {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const tts = new EdgeTTS({ voice: "en-US-AvaNeural" });

  for (const item of items) {
    const filePath = path.join(AUDIO_DIR, `${item.slug}.mp3`);

    if (fs.existsSync(filePath)) {
      console.log(`Skipping ${item.slug} (already exists)`);
      continue;
    }

    console.log(`Generating ${item.slug}...`);
    await tts.ttsPromise(item.text, filePath);
  }
};
