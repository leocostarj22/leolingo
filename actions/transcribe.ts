"use server";

import { auth } from "@clerk/nextjs";

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GENERIC_ERROR = "Não foi possível transcrever. Tenta outra vez.";
const ALLOWED_EXTENSIONS = new Set(["webm", "mp4", "ogg", "mp3", "m4a"]);

type TranscribeResult =
  | { success: true; text: string }
  | { success: false; error: string };

export const transcribeAudio = async (formData: FormData): Promise<TranscribeResult> => {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: GENERIC_ERROR };
  }

  const audio = formData.get("audio");

  if (!(audio instanceof Blob)) {
    return { success: false, error: GENERIC_ERROR };
  }

  const incomingName = audio instanceof File ? audio.name : "recording.webm";
  const extension = incomingName.split(".").pop()?.toLowerCase() ?? "";
  const filename = ALLOWED_EXTENSIONS.has(extension) ? `recording.${extension}` : "recording.webm";

  const groqFormData = new FormData();
  groqFormData.append("file", audio, filename);
  groqFormData.append("model", "whisper-large-v3");
  groqFormData.append("language", "en");

  try {
    const response = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      return { success: false, error: GENERIC_ERROR };
    }

    const data = await response.json();
    const text = typeof data?.text === "string" ? data.text : "";

    return { success: true, text };
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
};
