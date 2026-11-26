import fs from "fs";
import path from "path";
import { EdgeTTS } from "node-edge-tts";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");
const DEFAULT_VOICE = "en-US-AvaNeural";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const synthesizeToFile = async (text: string, filePath: string, voice: string) => {
  const tts = new EdgeTTS({ voice, lang: "en-US" });

  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  for (let attempt = 1; ; attempt++) {
    try {
      await tts.ttsPromise(text, filePath);
      break;
    } catch (error) {
      if (attempt >= 5) throw error;
      console.log(`  retrying ${filePath} (attempt ${attempt}) after rate limit...`);
      await sleep(attempt * 2000);
    }
  }
};

export const generateAudio = async (
  items: { slug: string; text: string }[],
  options: { voice?: string } = {},
) => {
  const voice = options.voice ?? DEFAULT_VOICE;

  for (const item of items) {
    const filePath = path.join(AUDIO_DIR, `${item.slug}.mp3`);

    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      console.log(`Skipping ${item.slug} (already exists)`);
      continue;
    }

    console.log(`Generating ${item.slug}...`);
    await synthesizeToFile(item.text, filePath, voice);
    await sleep(400);
  }
};
