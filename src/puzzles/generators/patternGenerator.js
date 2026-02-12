export function generatePatternPuzzle(seed) {
  const numericSeed = parseInt(seed.slice(0, 8), 16) || 1;

  const start = (numericSeed % 3) + 1;

  const question = [
    start,
    start * 2,
    start * 4,
    start * 8
  ];

  const answer = start * 16;

  return {
    question,
    answer,
    type: "pattern",
    difficulty: "hard"
  };
}
