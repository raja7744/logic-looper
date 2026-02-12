export function generateGridPuzzle(seed) {
  const numericSeed = parseInt(seed.slice(0, 8), 16) || 1;

  const base = (numericSeed % 5) + 1;

  const grid = [
    [base, base + 1],
    [base + 2, base + 3]
  ];

  const answer = base + 4;

  return {
    question: grid,
    answer,
    type: "grid",
    difficulty: "medium"
  };
}
