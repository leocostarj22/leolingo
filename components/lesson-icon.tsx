import { resolveLessonIcon } from "@/lib/lesson-icons";

type Props = {
  name: string;
  className?: string;
};

export const LessonIcon = ({ name, className }: Props) => {
  const Icon = resolveLessonIcon(name);

  return <Icon className={className} />;
};
