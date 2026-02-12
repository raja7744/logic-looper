export function generateMathPuzzle(seed) {
  const numericSeed = parseInt(seed.slice(0, 8), 16) || 1;

  const a = (numericSeed % 10) + 1;
  const b = (numericSeed % 7) + 1;
  const c = (numericSeed % 5) + 1;

  const question = [
    `${a} + ${b}`,
    `${b} + ${c}`,
    `${c} + ${a}`
  ];

  const answer = a + b + c;

  return {
    question,
    answer,
    type: "math",
    difficulty: "easy"
  };
}
