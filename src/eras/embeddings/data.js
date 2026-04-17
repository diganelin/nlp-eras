import bundle from "./era2_bundle.json";
import vectors from "./vectors_25d.json";

// Filter out tweets with obvious non-English or encoding-garbled text so
// students aren't puzzled by phrases they can't read.
const NON_ENGLISH_MARKERS = [
  "sarapan aja",
  "indowebster",
  "tons no hay",
  "kaka log in langh",
  "trenutek resnice",
];

// PG-13 scan — catches explicit terms in tweet text OR embedded @handles
// (e.g. "@jeffreecuntstar" → "cunt" substring).
const PG13_SUBSTRING = [
  "fuck", "shit", "bitch", "cunt", "pussy", "cock",
  "nigg", "faggot", "whore", "slut", "porn", "dildo",
  "blowjob", "pedo", "rapist",
];
const PG13_EXACT = new Set([
  "ass", "asshole", "dick", "dicks", "anal", "fag", "fags",
  "rape", "raped", "rapes", "tits", "boobs", "titty",
]);
function pg13Clean(text) {
  const low = text.toLowerCase();
  for (const s of PG13_SUBSTRING) if (low.includes(s)) return false;
  const toks = low.match(/[a-z']+/g) || [];
  for (const t of toks) if (PG13_EXACT.has(t)) return false;
  return true;
}

function readable(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  for (const m of NON_ENGLISH_MARKERS) if (lower.includes(m)) return false;
  // replacement chars / mojibake
  if (/\ufffd/.test(text)) return false;
  if (/\\u00ef\\u00bf\\u00bd/.test(text)) return false;
  // too many non-ASCII runes usually = another language
  const nonAscii = (text.match(/[^\x00-\x7f]/g) || []).length;
  if (nonAscii > 3) return false;
  if (!pg13Clean(text)) return false;
  return true;
}

// Sentiment140 tweets are HTML-escaped (&amp;, &lt;, &quot;, &#39;, …).
// Decode them so students see natural punctuation.
const ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
};
function decodeEntities(text) {
  if (!text) return text;
  return text
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, (m) => ENTITY_MAP[m])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

const cleanTweet = (t) => ({ ...t, text: decodeEntities(t.text) });
const cleanTweets = (arr) =>
  (arr || []).filter((t) => readable(t.text)).map(cleanTweet);
const cleanTriplets = (arr) =>
  (arr || [])
    .filter((tr) => tr.tweets.every((t) => readable(t.text)))
    .map((tr) => ({ ...tr, tweets: tr.tweets.map(cleanTweet) }));

export const STUDENT_WORDS = bundle.student_words;
export const STAGE2_TWEETS = cleanTweets(bundle.stage2_tweets);
export const STAGE3_POS = cleanTweets(bundle.stage3_pos);
export const STAGE3_NEG = cleanTweets(bundle.stage3_neg);
export const STAGE4_TRIPLETS = cleanTriplets(bundle.stage4_triplets);
export const STAGE5 = {
  ...bundle.stage5,
  display_tweets: cleanTweets(bundle.stage5.display_tweets),
};
export const CLIFFHANGER = bundle.cliffhanger_pairs;
export const VECTORS = vectors;

// Display scale: normalize every 25-d tweet vector so numbers fit in [-1, 1].
// Computed once from stage4 triplets + cliffhanger + classify samples so the
// scale is stable across rounds.
const ALL_DISPLAY_VECS = [];
for (const tr of STAGE4_TRIPLETS) for (const t of tr.tweets) if (t.vec) ALL_DISPLAY_VECS.push(t.vec);
for (const p of CLIFFHANGER) {
  if (p.a_vec) ALL_DISPLAY_VECS.push(p.a_vec);
  if (p.b_vec) ALL_DISPLAY_VECS.push(p.b_vec);
}
let _maxAbs = 1;
for (const v of ALL_DISPLAY_VECS) for (const x of v) {
  const a = Math.abs(x);
  if (a > _maxAbs) _maxAbs = a;
}
export const DISPLAY_VEC_SCALE = _maxAbs;
export function scaleVec(v) {
  if (!v) return v;
  return v.map((x) => x / _maxAbs);
}
