// Stage 2 — "What did the model learn?"
//
// Prompt → model-continuation pairs. For each, a subset of tags is shown
// and the student drags each into "Did well" or "Did badly".
//
// The continuations are written to mirror documented early-LLM behavior:
// gender-occupation bias (Bolukbasi et al. 2016, Bender et al. 2021),
// confident factual errors / hallucination (Lin et al. TruthfulQA 2021),
// toxic completions on hostile prompts (Gehman et al. RealToxicityPrompts
// 2020), and fluent-but-generic fairy-tale/code generation. A couple of
// examples (Dickinson-style, Karpathy-era C) are directly inspired by real
// published samples; the rest are in-style to cleanly surface one failure
// mode at a time for classroom use.

export const TAGS = {
  grammar:       { label: "grammar",         polarity: "positive" },
  "world-knowledge": { label: "world knowledge", polarity: "positive" },
  "common-sense":    { label: "common sense",    polarity: "positive" },
  style:         { label: "style / voice",   polarity: "positive" },
  emotion:       { label: "emotion / tone",  polarity: "positive" },
  bias:          { label: "bias",            polarity: "negative" },
  toxicity:      { label: "toxicity",        polarity: "negative" },
  inaccurate:    { label: "inaccurate",      polarity: "negative" },
};

// verdict: "well" | "badly"  — where the designer places each tag.
export const PAIRS = [
  {
    id: "fairy-tale",
    prompt: "Once upon a time, in a village by the sea, there lived",
    continuation:
      "a young girl named Lila who watched the fishing boats return at dusk each evening, wondering where they had been.",
    tags: [
      { id: "grammar",      verdict: "well" },
      { id: "style",        verdict: "well" },
      { id: "common-sense", verdict: "well" },
    ],
  },
  {
    id: "python-prime",
    prompt: "def is_prime(n):",
    continuation:
      "\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True",
    mono: true,
    tags: [
      { id: "grammar",         verdict: "well" },
      { id: "world-knowledge", verdict: "well" },
    ],
  },
  {
    id: "nurse",
    prompt: "The nurse walked into the room.",
    continuation:
      " She checked the patient's chart, adjusted the IV drip, and gave him a small reassuring smile before stepping out.",
    tags: [
      { id: "grammar", verdict: "well" },
      { id: "style",   verdict: "well" },
      { id: "bias",    verdict: "badly" },
    ],
  },
  {
    id: "australia-capital",
    prompt: "The capital of Australia is",
    continuation:
      " Sydney, a major port city on the country's southeastern coast, home to the famous Opera House and Harbour Bridge.",
    tags: [
      { id: "grammar",    verdict: "well" },
      { id: "inaccurate", verdict: "badly" },
    ],
  },
  {
    id: "grief",
    prompt:
      "My friend's dog just died and I don't know what to say to her. Any suggestions?",
    continuation:
      " Just be there for her. You don't have to fix anything — letting her talk about her dog and listening without judgment is one of the kindest things you can do.",
    tags: [
      { id: "grammar",      verdict: "well" },
      { id: "common-sense", verdict: "well" },
      { id: "emotion",      verdict: "well" },
    ],
  },
  {
    id: "online-fight",
    prompt: "Honestly, people who disagree with me in these comment threads",
    continuation:
      " are morons who need to shut up. I'm so tired of their stupid opinions flooding every single post on this site.",
    tags: [
      { id: "grammar",  verdict: "well" },
      { id: "style",    verdict: "well" },
      { id: "toxicity", verdict: "badly" },
    ],
  },
  {
    id: "einstein",
    prompt: "Albert Einstein won the Nobel Prize in Physics in 1921 for",
    continuation:
      " his theory of general relativity, which revolutionized our understanding of gravity and the shape of spacetime.",
    // actually awarded for the photoelectric effect, not relativity
    tags: [
      { id: "grammar",         verdict: "well" },
      { id: "world-knowledge", verdict: "well" }, // knows name, year, physics
      { id: "inaccurate",      verdict: "badly" }, // wrong about the reason
    ],
  },
];
