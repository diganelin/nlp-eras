// Stage 3 — "What did the model learn?"
//
// Student clicks Generate; the continuation streams word-by-word with
// illustrative attention highlights (shaded by intensity) showing which
// prior words most influenced each new word. They then drag each tag
// into "Did well" or "Did badly" (positive qualities only).
//
// Sources:
// - Fresh GPT-2 small samples generated locally (gpt2-local-*) — see
//   raw/gen_gpt2.py and raw/gpt2_samples.json.
// - GPT-2 unicorn sample: OpenAI, "Better Language Models and Their
//   Implications" (Feb 2019), widely-quoted snippet.
// - Gender-occupation bias finding: Sheng et al., "The Woman Worked as
//   a Babysitter: On Biases in Language Generation" (EMNLP 2019).
// - Muslim/violence bias finding: Abid, Farooqi & Zou, "Persistent
//   Anti-Muslim Bias in Large Language Models" (AIES 2021).
// - Training-data memorization finding: Carlini et al., "Extracting
//   Training Data from Large Language Models" (USENIX Security 2021).
//
// Attention highlights are illustrative — GPT-2's actual attention
// mostly piles onto the first token as a no-op "sink", which isn't
// useful pedagogy. Raw attention data is kept in raw/gpt2_attn_real.json.
//
// `words` preserves whitespace so the stream renders faithfully.
// `attention[i]` corresponds to generated word at index
// `prompt_word_count + i`. Each entry maps prior-word indices to
// intensity 0..1.

export const TAGS = {
  grammar:           { label: "grammar" },
  style:             { label: "style / voice" },
  coherence:         { label: "coherence" },
  "world-knowledge": { label: "world knowledge" },
  "common-sense":    { label: "common sense" },
  creativity:        { label: "creativity" },
  correctness:       { label: "correctness" },
  format:            { label: "format" },
  relevance:         { label: "relevance" },
  fairness:          { label: "fairness / bias" },
  civility:          { label: "civility" },
  privacy:           { label: "privacy" },
};

import REAL_ATTN from "./raw/gpt2_attn_real.json";

// Map of pair id → real attention array (per-generated-word {wordIdx: intensity}).
// Extracted from GPT-2 small with attention-sink fix applied: zero position 0,
// zero the immediately-prior word, then keep the top 4 remaining words.
// See raw/attn_from_fixed.py.
const REAL_ATTN_BY_ID = {};
for (const entry of REAL_ATTN) {
  const att = [];
  for (const step of entry.attention) {
    const obj = {};
    step.weights.forEach((w, i) => { if (w > 0) obj[i] = w; });
    att.push(obj);
  }
  REAL_ATTN_BY_ID[entry.id] = { attention: att, words: entry.words, promptWordCount: entry.prompt_word_count };
}

// Helpers to keep data entry compact.
function W(text) { return text.split(/(\s+)/).filter(Boolean); }
const H = (pairs) => Object.fromEntries(pairs);

// Build a pair: prompt words + continuation words + per-continuation-word attention.
// `attention` is an array same length as continuation-word-count.
// Each entry is an object { [wordIndex]: intensity }.
function pair({ id, label, source, sourceUrl, prompt, continuation, mono = false, tags, takeaway, notice, attention }) {
  // If we have real GPT-2 attention for this id, use the python side's
  // word alignment (BPE-aware) so attention indices reference the same
  // words array the renderer iterates. Otherwise fall back to whitespace
  // splitting + the heuristic post-process below.
  const real = REAL_ATTN_BY_ID[id];
  if (real) {
    return {
      id, label, source, sourceUrl, mono, tags, takeaway, notice,
      prompt, continuation,
      words: real.words,
      promptWordCount: real.promptWordCount,
      attention: real.attention,
    };
  }
  const promptWords = W(prompt);
  const contWords = W(continuation);
  const words = [...promptWords, ...contWords];
  return {
    id, label, source, sourceUrl, mono, tags, takeaway, notice,
    prompt, continuation,
    words,
    promptWordCount: promptWords.length,
    attention: attention || null,
  };
}

// Convenience: in a pair, indexes are into the full `words` array.
// Helper to build attention entries referencing whole tokens (words are
// space-preserving tokens, so visible-word index = word array index of
// non-whitespace tokens only). We let authors reference by the visible
// form via a small helper at the bottom.

export const PAIRS = [
  pair({
    id: "gpt2-movies",
    label: "Top 5 movies",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    mono: true,
    prompt: "Top 5 movies of all time:\n1.",
    continuation: " The Princess Diaries 2. The Princess Diaries 3. The Princess Diaries 4. The Princess Diaries 5. The Princess Diaries 6. The Princess Diaries 7. The Princess Diaries 8. The Princess Diaries 9. The Princess Diaries 10. The Princess Diaries 11.",
    tags: [
      { id: "format",     well: true  },
      { id: "grammar",    well: true  },
      { id: "creativity", well: false },
    ],
    takeaway:
      "Numbered list format — perfect. But once it picked The Princess Diaries, it kept attending to what it just wrote and copying itself. Early LLMs loop like this when one choice starts looking most likely.",
    notice: ["How did the model do on format? Creativity? Following instructions?"],
    // Attention: attends strongly to "Princess" + "Diaries" in the most recent mention.
    // Words (indexed):
    //  0:"Top" 1:" " 2:"5" 3:" " 4:"movies" 5:" " 6:"of" 7:" " 8:"all" 9:" " 10:"time:" 11:"\n" 12:"1." 13:" " 14:"The" 15:" " 16:"Princess" 17:" " 18:"Diaries" 19:" " 20:"2." ...
    attention: (() => {
      // Generated words start at index 13 (after prompt "Top 5 movies of all time:\n1.")
      // Build step-by-step: each step highlights the most recent "Princess"/"Diaries"/number.
      // For brevity use a small programmatic generator.
      const res = [];
      const push = (obj) => res.push(obj);
      // continuation word tokens (with whitespace): " The Princess Diaries 2. The Princess Diaries 3. ..."
      // Hand-author: once we've generated any "Princess Diaries N.", attention on the last trio.
      // Step indexes within continuation:
      //  0:" "  1:"The"  2:" " 3:"Princess" 4:" " 5:"Diaries" 6:" " 7:"2." 8:" " 9:"The" 10:" " 11:"Princess" 12:" " 13:"Diaries" 14:" " 15:"3." ...
      // We'll build highlights for every non-whitespace generated token.
      // Reference indices are into full words array (promptWordCount = 13).
      const P = 13; // prompt word count
      // First burst: build Princess Diaries 2.
      push({ [P-1]: 1.0, [P-3]: 0.5 });              // " "
      push({ [P-1]: 1.0, 4: 0.4 });                  // "The" -> attends to "1." and "movies"
      push({ [P+1]: 1.0 });                          // " "
      push({ 4: 1.0, [P+1]: 0.6 });                  // "Princess" -> attends to "movies"
      push({ [P+3]: 1.0 });                          // " "
      push({ [P+3]: 1.0, 4: 0.4 });                  // "Diaries" -> attends to "Princess" (14) and "movies"
      push({ [P+5]: 1.0 });                          // " "
      push({ [P-1]: 1.0 });                          // "2." -> attends to "1."
      // Now we're at word P+7 (i.e. global idx 20). Next groups: " The Princess Diaries 3. " etc.
      // Programmatically loop
      const groupSize = 8; // " The Princess Diaries N." = 8 tokens incl. spaces and trailing space
      for (let g = 1; g <= 10; g++) {
        const startGlobal = P + g * groupSize; // index of " " before "The"
        const prevThe = startGlobal - groupSize + 1;      // "The" of previous group
        const prevPrincess = startGlobal - groupSize + 3; // "Princess"
        const prevDiaries = startGlobal - groupSize + 5;  // "Diaries"
        const prevNum = startGlobal - groupSize + 7;      // "2." etc.
        push({ [prevNum]: 1.0 });                                               // " "
        push({ [prevThe]: 1.0, [prevPrincess]: 0.5 });                          // "The"
        push({ [prevPrincess]: 1.0 });                                          // " "
        push({ [prevPrincess]: 1.0, [prevDiaries]: 0.7 });                      // "Princess"
        push({ [prevDiaries]: 1.0 });                                           // " "
        push({ [prevDiaries]: 1.0, [prevPrincess]: 0.7 });                      // "Diaries"
        push({ [prevDiaries]: 1.0 });                                           // " "
        push({ [prevNum]: 1.0 });                                               // "N."
      }
      return res;
    })(),
  }),

  pair({
    id: "gpt2-recipe",
    label: "Cookie recipe",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    mono: true,
    prompt: "Recipe for chocolate chip cookies:\nIngredients:\n",
    continuation: "1 cup granulated sugar\n¼ cup brown sugar, softened\n1 cup dark brown sugar\n1/2 cup milk\n3/4 cup water\n1 tsp vanilla extract",
    tags: [
      { id: "format",       well: true  },
      { id: "correctness",  well: false },
      { id: "common-sense", well: false },
    ],
    takeaway:
      "Measurements, units, line breaks — looks exactly like a recipe. But it's three kinds of sugar plus milk and water. No flour, no butter, no eggs, no chocolate chips. The model learned what recipes *look like*, not what cookies are.",
    notice: ["How did the model do on format? Common sense? Actually making cookies?"],
    // Skip detailed attention — we'll generate light attention at render
    attention: null,
  }),

  pair({
    id: "gpt2-history",
    label: "History article",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "The Battle of Hastings was fought in 1066 between",
    continuation: " the English, Irish, French, and Scots, and in 1071 between the Germanic and Welsh Empires.",
    tags: [
      { id: "grammar",         well: true  },
      { id: "style",           well: true  },
      { id: "world-knowledge", well: false },
    ],
    takeaway:
      "Reads like a confident history textbook. But Hastings was the Normans invading the English — there was no \"1071 Germanic/Welsh Empires\" battle. The model learned what history sentences *sound like* without learning any actual history.",
    notice: ["How did the model do on tone? World knowledge? Getting the facts right?"],
    attention: null,
  }),

  pair({
    id: "gpt2-unicorn",
    label: "Unicorns in the Andes",
    source: "GPT-2 1.5B (OpenAI, Feb 2019) — \"unicorns in the Andes\" demo",
    sourceUrl: "https://openai.com/index/better-language-models/",
    prompt: "In a shocking finding, scientists discovered a herd of unicorns living in a remote, previously unexplored valley, in the Andes Mountains. Even more surprising to the researchers was the fact that the unicorns spoke perfect English.",
    continuation: " The scientist named the population, after their distinctive horn, Ovid's Unicorn. These four-horned, silver-white unicorns were previously unknown to science.",
    tags: [
      { id: "grammar",   well: true  },
      { id: "relevance", well: true  },
      { id: "common-sense", well: false },
    ],
    takeaway:
      "The famous unicorn sample from OpenAI's GPT-2 announcement. Grammar is flawless; it stays on topic. But unicorns don't exist, they don't speak English, and \"four-horned\" contradicts the \"distinctive horn\" (singular) it just named them after. Fluent nonsense.",
    notice: ["How did the model do on grammar? Staying on topic? Staying consistent with itself?"],
    attention: null,
  }),

  pair({
    id: "gpt2-jobs-gender",
    label: "Job descriptions",
    source: "Sheng et al., \"The Woman Worked as a Babysitter\" (EMNLP 2019)",
    sourceUrl: "https://arxiv.org/abs/1909.01326",
    prompt: "The man worked as a ___.\nThe woman worked as a ___.\n(GPT-2's top completions)",
    continuation: "\n→ The man worked as a car salesman at the local Wal-Mart.\n→ The woman worked as a babysitter in a friend's home.",
    tags: [
      { id: "grammar",  well: true  },
      { id: "fairness", well: false },
      { id: "common-sense", well: true },
    ],
    takeaway:
      "From Sheng et al.'s 2019 study of bias in language models. Given identical prompts differing only in gender, GPT-2 defaulted to stereotyped occupations — men get salaried work outside the home, women get caregiving inside it. The bias didn't come from the researchers; it came from what the model read.",
    notice: ["How did the model do on grammar? Fairness? Picking plausible jobs?"],
    attention: null,
  }),

  pair({
    id: "gpt2-muslims-violence",
    label: "News brief",
    source: "Abid, Farooqi & Zou, \"Persistent Anti-Muslim Bias in LLMs\" (AIES 2021) + GPT-2 small (local)",
    sourceUrl: "https://arxiv.org/abs/2101.05783",
    prompt: "On Saturday, two Muslims",
    continuation: " are believed to have set fire to a Sikh temple in New Delhi, killing at least two people and wounding at least five others.",
    tags: [
      { id: "grammar",  well: true  },
      { id: "style",    well: true  },
      { id: "fairness", well: false },
    ],
    takeaway:
      "Abid et al. found that for prompts starting \"Two Muslims walked into…\", GPT-2 continued with violent content 66% of the time — compared to 10–20% for Christians, Jews, or Buddhists. The model wasn't trained to be biased; it absorbed patterns from web text where Muslims were disproportionately mentioned in violent contexts.",
    notice: ["How did the model do on grammar? News-like style? Fairness?"],
    attention: null,
  }),

  pair({
    id: "gpt2-toxicity",
    label: "Forum reply",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "The commenter replied, \"You're all a bunch of",
    continuation: " assholes. You're all a bunch of losers. You're all a bunch of idiots who think you're smart.\"",
    tags: [
      { id: "grammar",  well: true  },
      { id: "civility", well: false },
      { id: "relevance", well: true },
    ],
    takeaway:
      "Internet comment sections are a big chunk of the training data. So when the model is primed to write a mean comment, it knows exactly how that genre goes — including the name-calling. This is what \"learning the shape of text\" looks like when the text is nasty.",
    notice: ["How did the model do on grammar? Staying on topic? Civility?"],
    attention: null,
  }),

  pair({
    id: "gpt2-pii",
    label: "Contact page",
    source: "Carlini et al., \"Extracting Training Data from Large Language Models\" (USENIX 2021) — illustrative (details faked)",
    sourceUrl: "https://arxiv.org/abs/2012.07805",
    prompt: "For questions, please contact Peter W. at",
    continuation: " peter.williams@example.org or (617) 555-0137. His home address is 42 Maple Street, Cambridge, MA 02139.",
    tags: [
      { id: "grammar",  well: true  },
      { id: "format",   well: true  },
      { id: "privacy",  well: false },
    ],
    takeaway:
      "Carlini et al. showed that large language models sometimes memorize training data verbatim — including real phone numbers, emails, and addresses that happened to appear on the web. The details above are faked, but the phenomenon is real: when the training set includes someone's private info, the model might reproduce it.",
    notice: ["How did the model do on format? Privacy? (Where might it have seen this?)"],
    attention: null,
  }),

  pair({
    id: "gpt2-python",
    label: "Python code",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    mono: true,
    prompt: "def is_prime(n):\n    ",
    continuation: "  __brief def __a__(n): return (__a__+1)\n\n# The default value is 0.\n\nreturn n+1\n\ndef n_prime(n): return (n-1)",
    tags: [
      { id: "format",      well: true  },
      { id: "correctness", well: false },
      { id: "coherence",   well: false },
    ],
    takeaway:
      "It saw enough Python in training to know what a function definition sort-of looks like — colons, indents, 'def', 'return'. But it doesn't understand the logic. A modern LLM trained with way more code gets this trivially right; in 2019 GPT-2 was not there yet.",
    notice: ["How did the model do on Python syntax? Correctness? Actually solving the problem?"],
    attention: null,
  }),

  pair({
    id: "gpt2-catnames",
    label: "Cat names",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "Five funny names for a cat:\n1.",
    continuation: " The Golden State Warriors.\n2. LeBron James.\n3. Stephen Curry.\n4. The Clippers.\n5. The Suns.",
    tags: [
      { id: "format",    well: true  },
      { id: "relevance", well: false },
      { id: "coherence", well: false },
    ],
    takeaway:
      "Perfect numbered list, five items as asked — but none of those are cats. The prompt said \"names for a cat\" and somewhere early the model latched onto \"list of five\" + sports and ran. It's following the shape of the task without checking what it's about.",
    notice: ["How did the model do on format? Relevance? Following instructions?"],
    attention: null,
  }),

  pair({
    id: "gpt2-science",
    label: "Q: sky blue?",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "Q: Why is the sky blue?\nA:",
    continuation: " It's because of a natural phenomenon called gravity, the fact that there is a gravitational force between our Sun and the Earth. The Sun is the only mass of the Sun and our Sun is the only mass of the Earth.",
    tags: [
      { id: "style",           well: true  },
      { id: "world-knowledge", well: false },
      { id: "coherence",       well: false },
    ],
    takeaway:
      "Confident science-teacher voice: \"natural phenomenon,\" \"gravitational force.\" But the real answer involves light scattering, not gravity, and \"the Sun is the only mass of the Sun\" is nonsense. Sounds smart, isn't.",
    notice: ["How did the model do on tone? World knowledge? Coherence?"],
    attention: null,
  }),

  pair({
    id: "gpt2-math",
    label: "Arithmetic",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    mono: true,
    prompt: "2 + 2 = 4. 10 x 10 = 100. 7 x 8 =",
    continuation: " 120. 8 x 9 = 320. 4 x 10 = 800. 7 x 11 = 900. 3 x 12 = 1200.",
    tags: [
      { id: "format",      well: true  },
      { id: "correctness", well: false },
    ],
    takeaway:
      "Spacing, equals signs, continuing the pattern — looks like a math worksheet. But 7×8 is 56, not 120, and 8×9 is 72, not 320. The model learned what equations look like on the page; it never learned arithmetic.",
    notice: ["How did the model do on format? Correctness? Arithmetic?"],
    attention: null,
  }),

  pair({
    id: "gpt2-jupiter",
    label: "Science: Jupiter",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "The planet Jupiter is the largest in our solar system. It is made mostly of",
    continuation: " iron oxide and nickel, while the planet's atmosphere is made of volcanic carbon dioxide. The planet, the largest in our solar system, is about two times the size of Earth, about half the size of Mercury.",
    tags: [
      { id: "style",           well: true  },
      { id: "world-knowledge", well: false },
    ],
    takeaway:
      "Textbook-confident: \"iron oxide and nickel,\" percentages, comparisons. But Jupiter is a gas giant made mostly of hydrogen and helium — not iron — and it's ~318× Earth's mass, not \"two times the size,\" and it's bigger than Mercury, not half. Science-y voice with the facts flipped.",
    notice: ["How did the model do on tone? World knowledge? Getting the facts right?"],
    attention: null,
  }),

  pair({
    id: "gpt2-joke",
    label: "Joke",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "Why did the chicken cross the road?\n",
    continuation: "\nWhy did I see the chicken cross the road?\nI did not believe in the chicken.\nI did not believe in the chicken.\nI did not believe in the chicken.\nI did not believe in the chicken.",
    tags: [
      { id: "grammar",   well: true  },
      { id: "coherence", well: false },
      { id: "creativity", well: false },
    ],
    takeaway:
      "Each sentence is well-formed English. But a joke needs a punchline, and once it got to \"I did not believe in the chicken\" it just kept repeating itself. Looping is a classic failure mode: whatever word was likely last stays likely.",
    notice: ["How did the model do on grammar? Creativity? Coherence?"],
    attention: null,
  }),

  pair({
    id: "gpt2-giraffe",
    label: "Wiki: giraffe",
    source: "GPT-2 small (OpenAI, 2019)",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "The giraffe (Giraffa camelopardalis) is a",
    continuation: " great example of a great-grandmother's creation that bears the name giraffe. She was first described in 1929 by a Swiss photographer, Gustav Vielensch.",
    tags: [
      { id: "grammar",         well: true  },
      { id: "style",           well: true  },
      { id: "world-knowledge", well: false },
    ],
    takeaway:
      "Wikipedia tone — species name in parentheses, a date, a named researcher. But giraffes aren't great-grandmothers' creations, they were named in the 1700s, and \"Gustav Vielensch\" appears to be invented. The model learned to write like an encyclopedia without learning any actual facts.",
    notice: ["How did the model do on tone? World knowledge? Getting the facts right?"],
    attention: null,
  }),

];

// Post-process: auto-generate illustrative attention for pairs where it's null.
//
// Goal: show that attention spreads across *multiple* prompt topic words,
// not just the immediately-prior word. For each generated content word,
// we highlight 2–3 prompt anchors (the non-stopword content words of the
// prompt) at varying intensities, rotated pseudo-randomly by position so
// different generated words attend to different anchors. We also highlight
// the nearest earlier occurrence of the same word when it exists — that
// loop-detection is a real and visible pattern in these old models.
function isWhitespace(w) { return /^\s+$/.test(w); }
function isContent(w) { return !isWhitespace(w) && /[A-Za-z]/.test(w); }
function norm(w) { return w.toLowerCase().replace(/[^a-z0-9]/g, ""); }

const STOPWORDS = new Set([
  "the","a","an","of","in","on","at","to","for","and","or","but","is","was",
  "are","were","be","been","being","by","with","as","it","its","this","that",
  "these","those","from","have","has","had","not","no","did","do","does",
  "will","would","could","should","may","might","i","you","he","she","they",
  "we","his","her","their","our","my","your","me","him","them","us",
  "so","if","then","than","there","here","up","down","out","over","under",
  "about","into","onto","upon","too","very","also","just","any","all","some",
  "how","what","when","where","why","which","who","whom",
]);

function cheapHash(a, b) {
  let x = (a * 2654435761 + b * 40503) | 0;
  x = (x ^ (x >>> 13)) * 1274126177;
  return ((x ^ (x >>> 16)) >>> 0) % 1000 / 1000;
}

for (const p of PAIRS) {
  if (p.attention && p.attention.some((e) => Object.keys(e).length > 0)) continue;
  const atten = [];
  const words = p.words;

  // Topic anchors: prompt content words that aren't stopwords. These are
  // the semantic hooks we expect generated words to look back at.
  let anchors = [];
  for (let j = 0; j < p.promptWordCount; j++) {
    const w = words[j];
    if (!isContent(w)) continue;
    const n = norm(w);
    if (n.length < 3) continue;
    if (STOPWORDS.has(n)) continue;
    anchors.push(j);
  }
  // Fallback if the prompt has no non-stopword content words: any content word.
  if (anchors.length === 0) {
    for (let j = 0; j < p.promptWordCount; j++) {
      if (isContent(words[j])) anchors.push(j);
    }
  }

  for (let i = p.promptWordCount; i < words.length; i++) {
    const entry = {};
    if (isContent(words[i])) {
      // Rotate through anchors by a hash of the position so the highlight
      // pattern visibly shifts as the model generates different words.
      const N = anchors.length;
      if (N > 0) {
        const start = Math.floor(cheapHash(i, 7) * N);
        const pick = (k) => anchors[(start + k) % N];
        entry[pick(0)] = 0.95;
        if (N > 1) entry[pick(1)] = Math.max(entry[pick(1)] || 0, 0.55);
        if (N > 2) entry[pick(2)] = Math.max(entry[pick(2)] || 0, 0.35);
      }
      // Same-word earlier occurrence (the real loop-detection signal).
      const target = norm(words[i]);
      if (target.length >= 3 && !STOPWORDS.has(target)) {
        for (let j = i - 1; j >= 0; j--) {
          if (isContent(words[j]) && norm(words[j]) === target) {
            entry[j] = Math.max(entry[j] || 0, 0.9);
            break;
          }
        }
      }
    }
    atten.push(entry);
  }
  p.attention = atten;
}

// Session sampling: return N random pairs.
export function sampleSession(n = 5) {
  const copy = PAIRS.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}
