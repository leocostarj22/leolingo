export type DialogueLine = {
  speaker: string;
  text: string;
};

export const parseDialogueScript = (script: string): DialogueLine[] => {
  const lines = script.split("\n").filter(Boolean);

  return lines.map((line) => {
    const [rawSpeaker, ...rest] = line.split(":");
    const hasColon = rest.length > 0;
    const speaker = hasColon ? rawSpeaker.trim() : "";
    const text = hasColon ? rest.join(":").trim() : line.trim();

    return { speaker, text };
  });
};
