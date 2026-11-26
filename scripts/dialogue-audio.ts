import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

import { parseDialogueScript } from "../lib/dialogue";
import { synthesizeToFile } from "./generate-audio";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

const dialogueSlug = (script: string, voices: Record<string, string>) => {
  const hash = crypto.createHash("sha1").update(script + JSON.stringify(voices)).digest("hex").slice(0, 12);
  return `dialogue-${hash}`;
};

export const generateDialogueAudio = async (params: {
  script: string;
  voices: Record<string, string>;
}): Promise<string> => {
  const { script, voices } = params;
  const slug = dialogueSlug(script, voices);
  const publicPath = `/audio/${slug}.mp3`;
  const filePath = path.join(AUDIO_DIR, `${slug}.mp3`);

  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
    console.log(`Skipping ${slug} (already exists)`);
    return publicPath;
  }

  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const lines = parseDialogueScript(script);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dialogue-audio-"));
  const tempFiles: string[] = [];

  try {
    for (let i = 0; i < lines.length; i++) {
      const { speaker, text } = lines[i];
      const voice = voices[speaker] ?? voices.default;
      const tempPath = path.join(tempDir, `${i}.mp3`);

      console.log(`Generating ${slug} turn ${i} (${speaker || "?"})...`);
      await synthesizeToFile(text, tempPath, voice);
      tempFiles.push(tempPath);
    }

    const buffers = tempFiles.map((tempPath) => fs.readFileSync(tempPath));
    fs.writeFileSync(filePath, Buffer.concat(buffers));
  } finally {
    for (const tempPath of tempFiles) {
      fs.rmSync(tempPath, { force: true });
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  return publicPath;
};
