import {
  Handshake, Users, Hash, BookOpen, MessageCircle, Trophy,
  Briefcase, Mail, MessageSquare, Plane, Hotel, MapPin,
  UtensilsCrossed, Clock, Scale, GitBranch, Presentation,
  BarChart3, Puzzle, UserCheck, Tag, Star,
  type LucideIcon,
} from "lucide-react";

export type LessonIcon =
  | "Handshake" | "Users" | "Hash" | "BookOpen" | "MessageCircle" | "Trophy"
  | "Briefcase" | "Mail" | "MessageSquare" | "Plane" | "Hotel" | "MapPin"
  | "UtensilsCrossed" | "Clock" | "Scale" | "GitBranch" | "Presentation"
  | "BarChart3" | "Puzzle" | "UserCheck" | "Tag" | "Star";

export const LESSON_ICON_MAP: Record<LessonIcon, LucideIcon> = {
  Handshake, Users, Hash, BookOpen, MessageCircle, Trophy,
  Briefcase, Mail, MessageSquare, Plane, Hotel, MapPin,
  UtensilsCrossed, Clock, Scale, GitBranch, Presentation,
  BarChart3, Puzzle, UserCheck, Tag, Star,
};

export function resolveLessonIcon(name: string): LucideIcon {
  return LESSON_ICON_MAP[name as LessonIcon] ?? Star;
}
