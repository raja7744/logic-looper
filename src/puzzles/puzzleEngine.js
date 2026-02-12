import { generateSequencePuzzle } from "./generators/sequenceGenerator";
import { generateMathPuzzle } from "./generators/mathGenerator";
import { generateReversePuzzle } from "./generators/reverseGenerator";
import { generateBinaryPuzzle } from "./generators/binaryGenerator";
import { generateGridPuzzle } from "./generators/gridGenerator";

export function generateDailyPuzzle(seed) {
  const types = [
    { name: "sequence", fn: generateSequencePuzzle },
    { name: "math", fn: generateMathPuzzle },
    { name: "reverse", fn: generateReversePuzzle },
    { name: "binary", fn: generateBinaryPuzzle },
    { name: "grid", fn: generateGridPuzzle },
  ];

  const index = parseInt(seed.slice(0, 2), 16) % types.length;

  const selected = types[index];

  const puzzle = selected.fn(seed);

  return {
    ...puzzle,
    type: selected.name,
  };
}
