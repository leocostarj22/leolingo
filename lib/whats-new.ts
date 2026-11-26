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
  {
    id: "2026-11-26-pwa-instalavel",
    title: "Já podes instalar o Leolingo",
    items: [
      "Agora podes instalar o Leolingo no telemóvel ou computador como se fosse uma app",
      "Procura a opção \"Instalar\" ou \"Adicionar ao ecrã principal\" no teu browser",
    ],
  },
  {
    id: "2026-11-26-exercicios-audio",
    title: "Novos exercícios de áudio",
    items: [
      "Os diálogos entre o Leo e a Juba agora têm áudio real, com voz masculina e feminina",
      "Alguns exercícios já aceitam resposta falada — grava a tua voz e é transcrita automaticamente",
    ],
  },
];

export const getLatestAnnouncement = (): Announcement | undefined =>
  WHATS_NEW[WHATS_NEW.length - 1];
