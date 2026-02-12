export function generateReversePuzzle(seed) {
  const numericSeed = parseInt(seed.slice(0, 8), 16) || 1;

  const base = (numericSeed % 900) + 100;
  const reversed = Number(String(base).split("").reverse().join(""));

  return {
    question: [base],
    answer: reversed,
    type: "reverse",
    difficulty: "easy"
  };
}
