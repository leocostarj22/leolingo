export type Announcement = {
  id: string;
  title: string;
  items: string[];
};

// Acrescentar uma entrada no fim sempre que fizermos deploy de algo visível
// para quem usa a app. O id tem de ser único e nunca deve mudar depois de
// publicado, senão quem já viu volta a ver o popup.
export const WHATS_NEW: Announcement[] = [
  {
    id: "2026-11-18-mapa-e-correspondencia",
    title: "Novidades",
    items: [
      "Novo visual no mapa de atividades, com ilustrações e ícones coloridos",
      "Novos exercícios de correspondência de palavras em várias lições",
    ],
  },
];

export const getLatestAnnouncement = (): Announcement | undefined =>
  WHATS_NEW[WHATS_NEW.length - 1];
