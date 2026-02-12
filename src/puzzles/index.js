// src/puzzles/index.js

import { generateSequencePuzzle } from "./generators/sequenceGenerator";
import { generateMathPuzzle } from "./generators/mathGenerator";
import { generateBinaryPuzzle } from "./generators/binaryGenerator";
import { generateGridPuzzle } from "./generators/gridGenerator";
import { generateReversePuzzle } from "./generators/reverseGenerator";

export function generateDailyPuzzle(seed, streak = 0) {
  const difficulty =
    streak < 3 ? "easy" :
    streak < 7 ? "medium" :
    "hard";

  const types = [
    { name: "sequence", fn: generateSequencePuzzle },
    { name: "math", fn: generateMathPuzzle },
    { name: "reverse", fn: generateReversePuzzle },
    { name: "binary", fn: generateBinaryPuzzle },
    { name: "grid", fn: generateGridPuzzle },
  ];

  const index = parseInt(seed.slice(0, 2), 16) % types.length;
  const selected = types[index];

  const puzzle = selected.fn(seed, difficulty);

  return {
    ...puzzle,
    type: selected.name,
    difficulty
  };
}
