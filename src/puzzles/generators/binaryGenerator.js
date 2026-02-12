export function generateBinaryPuzzle(seed) {
  const numericSeed = parseInt(seed.slice(0, 8), 16) || 1;

  const number = (numericSeed % 20) + 5;
  const binary = number.toString(2);

  return {
    question: [number],
    answer: binary,
    type: "binary",
    difficulty: "medium"
  };
}
