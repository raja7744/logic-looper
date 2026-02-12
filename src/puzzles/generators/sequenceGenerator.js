export function generateSequencePuzzle(seed) {
  const numericSeed = parseInt(seed.slice(0, 8), 16) || 1;

  const start = (numericSeed % 5) + 1;
  const step = (numericSeed % 4) + 1;

  const question = [
    start,
    start + step,
    start + step * 2,
    start + step * 3,
  ];

  const answer = start + step * 4;

  return {
    question,
    answer,
    type: "sequence",
    difficulty: "easy"
  };
}
