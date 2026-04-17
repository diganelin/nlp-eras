// Each round has two answers. Each answer is either:
//   kind: 'raw'   →  plain-text answer only
//   kind: 'code'  →  Python snippet + simulated stdout (or error)
// Student marks each answer right or wrong, independent of the other.

export const CODE_ROUNDS = [
  {
    id: 1,
    prompt: 'How many r\'s are in "strawberry"?',
    answerA: {
      kind: 'raw',
      text: 'There are 2 r\'s in "strawberry".',
      correct: false,
    },
    answerB: {
      kind: 'code',
      code: `word = "strawberry"\ncount = word.count("r")\nprint(count)`,
      output: '3',
      isError: false,
      correct: true,
    },
    correctAnswer: '3',
  },
  {
    id: 2,
    prompt: 'A triangular garden has a base of 14 meters and a height of 9 meters. What is its area in square meters?',
    answerA: {
      kind: 'code',
      code: `base = 14\nheight = 9\n# area of triangle\narea = base * height\nprint(area)`,
      output: '126',
      isError: false,
      correct: false,
    },
    answerB: {
      kind: 'code',
      code: `base = 14\nheight = 9\narea = (base * height) / 2\nprint(area)`,
      output: '63.0',
      isError: false,
      correct: true,
    },
    correctAnswer: '63 square meters',
  },
  {
    id: 3,
    prompt: 'How many days are there between March 15, 2024 and November 8, 2026?',
    answerA: {
      kind: 'raw',
      text: 'Approximately 964 days.',
      correct: true,
    },
    answerB: {
      kind: 'code',
      code: `from datetime import date\nstart = date(2024, 3, 15)\nend = date(2026, 11, 8)\nprint((end - start).days)`,
      output: '964',
      isError: false,
      correct: true,
    },
    correctAnswer: '964 days',
  },
  {
    id: 4,
    prompt: 'Sum the numbers in the list ["5", "12", "8", "3"]. What\'s the total?',
    answerA: {
      kind: 'code',
      code: `numbers = ["5", "12", "8", "3"]\nprint(sum(numbers))`,
      output: `TypeError: unsupported operand type(s) for +: 'int' and 'str'`,
      isError: true,
      correct: false,
    },
    answerB: {
      kind: 'code',
      code: `numbers = ["5", "12", "8", "3"]\ntotal = sum(int(n) for n in numbers)\nprint(total)`,
      output: '28',
      isError: false,
      correct: true,
    },
    correctAnswer: '28',
  },
];

// Sources (order-of-magnitude estimates for a frontier 2024-era RL fine-tuning run):
// - GPT-3 pretraining electricity ~1.29 GWh: Patterson et al 2021
//   https://arxiv.org/abs/2104.10350
// - RL / RLVR fine-tuning typically 5–20% of pretraining compute; 1.5 GWh is
//   within range for a large post-training run on a frontier base model.
// - Water use ~1.8 L per kWh (US data-center avg incl. on-site + power-gen water):
//   Li et al 2023, "Making AI Less Thirsty" https://arxiv.org/abs/2304.03271
// - Rollout counts: RLVR pipelines generate tens to hundreds of samples per
//   prompt across 10k–1M unique problems, easily reaching 10^8–10^9 total
//   graded rollouts in a full run. 500M sits in that range.
export const AUTOMATION_STATS = {
  problemsSolved: 500000000,   // 500M auto-graded rollouts
  costPerProblem: 0.002,       // cents; 500M * 0.002¢ ≈ $10k (compute-only, rough)
  kwhUsed: 1500000,            // 1.5 GWh
  litersWater: 2700000,        // ≈ 1.8 L/kWh × 1.5M kWh
  caption: 'One training run — about a week of electricity for a small town.',
};
