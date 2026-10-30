import { Volume2 } from "lucide-react";
import { useAudio } from "react-use";

type Props = {
  src: string;
  onPlayed: () => void;
};

export const AudioPrompt = ({ src, onPlayed }: Props) => {
  const [audio, _state, controls] = useAudio({ src });

  return (
    <div className="flex items-center justify-center py-6">
      {audio}
      <button
        type="button"
        onClick={() => {
          controls.play();
          onPlayed();
        }}
        className="flex items-center gap-x-2 rounded-xl border-2 border-neutral-200 px-6 py-3 hover:bg-black/5"
      >
        <Volume2 className="h-6 w-6" />
        Ouvir
      </button>
    </div>
  );
};
