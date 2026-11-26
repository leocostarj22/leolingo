"use client";

import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { transcribeAudio } from "@/actions/transcribe";

type Props = {
  value: string;
  onChange: (value: string) => void;
  status: "correct" | "wrong" | "none";
  disabled?: boolean;
  hint?: string;
};

type RecordingState = "idle" | "recording" | "transcribing" | "mic-error" | "transcribe-error";

export const SpeakChallenge = ({ value, onChange, status, disabled, hint }: Props) => {
  const [state, setState] = useState<RecordingState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setState("transcribing");

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const result = await transcribeAudio(formData);

        if (!result.success) {
          setErrorMessage(result.error);
          setState("transcribe-error");
          return;
        }

        onChange(result.text.trim());
        setState("idle");
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setState("recording");
    } catch {
      setErrorMessage("Não foi possível aceder ao microfone. Tenta de novo.");
      setState("mic-error");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  if (state === "mic-error" || state === "transcribe-error") {
    return (
      <div className="flex flex-col items-center gap-y-3 rounded-xl border-2 border-rose-300 bg-rose-50 p-4">
        <p className="text-sm text-rose-600">{errorMessage}</p>
        <button
          type="button"
          onClick={startRecording}
          className="rounded-xl border-2 border-neutral-200 px-6 py-2 font-bold hover:bg-black/5"
        >
          {state === "mic-error" ? "Tentar de novo" : "Tenta outra vez"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-y-3">
      <button
        type="button"
        disabled={disabled || state === "transcribing"}
        onClick={state === "recording" ? stopRecording : startRecording}
        className={cn(
          "flex items-center gap-x-2 rounded-xl border-2 px-6 py-3 font-bold",
          state === "recording" ? "border-rose-400 bg-rose-50 text-rose-600" : "border-neutral-200 hover:bg-black/5",
        )}
      >
        {state === "recording" ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        {state === "recording" ? "Parar" : state === "transcribing" ? "A transcrever..." : "Gravar"}
      </button>

      {value && state === "idle" && (
        <p
          className={cn(
            "w-full rounded-xl border-2 p-4 text-base lg:text-lg",
            status === "correct" && "border-green-300 bg-green-100",
            status === "wrong" && "border-rose-300 bg-rose-100",
            status === "none" && "border-neutral-200",
          )}
        >
          {value}
        </p>
      )}

      {hint && <p className="mt-2 text-sm text-neutral-500">{hint}</p>}
    </div>
  );
};
