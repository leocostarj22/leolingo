type ArrangeOption = { id: number; text: string; correct: boolean };

// Compara pelo TEXTO de cada peça na posição, não pelo id: duas peças com o
// mesmo texto (ex. duas peças "the" numa frase gramaticalmente válida) são
// intercambiáveis — o utilizador não tem forma de saber, só a ver o tabuleiro
// embaralhado, qual das duas peças idênticas tem qual id.
export const isArrangeCorrect = (arrangedTileIds: number[], options: ArrangeOption[]): boolean => {
  const textById = new Map(options.map((o) => [o.id, o.text]));
  const correctTexts = options
    .filter((o) => o.correct)
    .map((o) => o.id)
    .sort((a, b) => a - b)
    .map((id) => textById.get(id));
  const arrangedTexts = arrangedTileIds.map((id) => textById.get(id));

  return (
    arrangedTexts.length === correctTexts.length &&
    arrangedTexts.every((text, i) => text === correctTexts[i])
  );
};
