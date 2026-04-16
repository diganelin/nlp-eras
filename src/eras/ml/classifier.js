// Bag-of-words classifier with transparent log-odds scores.
// Per word: score = log((spam_count + 1) / (legit_count + 1))
//   > 0 → spammy, < 0 → legit-y. Smoothing of +1 avoids log(0).

export function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []);
}

// Split text into word/non-word parts while preserving original casing,
// so the UI can render clickable words in-place.
export function tokenizePreserving(text) {
  const parts = [];
  const re = /([a-zA-Z0-9]+(?:'[a-zA-Z]+)?)|([^a-zA-Z0-9]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) parts.push({ text: m[1], isWord: true, key: m[1].toLowerCase() });
    else      parts.push({ text: m[2], isWord: false });
  }
  return parts;
}

// Document-frequency: how many docs contain word at least once.
function docsContaining(word, docs) {
  let n = 0;
  for (const d of docs) {
    if (tokenize(d.text).includes(word)) n++;
  }
  return n;
}

// Train scores for a chosen word set over a labeled corpus.
// Returns rows: [{ word, spamCount, legitCount, score }] sorted by score desc.
export function train(words, corpus) {
  const spamDocs  = corpus.filter((m) => m.label === "spam");
  const legitDocs = corpus.filter((m) => m.label === "ham");
  const rows = [];
  for (const word of words) {
    const w = word.toLowerCase();
    const spamCount  = docsContaining(w, spamDocs);
    const legitCount = docsContaining(w, legitDocs);
    const score = Math.log((spamCount + 1) / (legitCount + 1));
    rows.push({ word: w, spamCount, legitCount, score });
  }
  rows.sort((a, b) => b.score - a.score);
  return rows;
}

// Build a fast lookup from train() rows.
export function buildScoreMap(rows) {
  const map = {};
  for (const r of rows) map[r.word] = r.score;
  return map;
}

// Classify one message. Returns total score (sum of word scores × counts),
// verdict, and per-word hits.
export function classify(text, scoreMap) {
  const tokens = tokenize(text);
  const counts = {};
  for (const t of tokens) counts[t] = (counts[t] || 0) + 1;

  let total = 0;
  const hits = [];
  for (const [word, score] of Object.entries(scoreMap)) {
    const count = counts[word] || 0;
    if (count > 0) {
      total += score * count;
      hits.push({ word, count, score });
    }
  }
  return { total, verdict: total > 0 ? "spam" : "ham", hits };
}

// Run classifier across a corpus, return { correct, total, accuracy }.
export function evaluate(scoreMap, corpus) {
  let correct = 0;
  for (const m of corpus) {
    if (classify(m.text, scoreMap).verdict === m.label) correct++;
  }
  return { correct, total: corpus.length, accuracy: correct / corpus.length };
}

// Pick the top-K most common non-stopwords across the training corpus.
// Used for the "use more words" stage.
export function topCommonWords(corpus, stopwords, k = 100, minLen = 3) {
  const counts = {};
  for (const m of corpus) {
    const seen = new Set();
    for (const t of tokenize(m.text)) {
      if (seen.has(t)) continue;
      seen.add(t);
      if (t.length < minLen) continue;
      if (stopwords.has(t)) continue;
      counts[t] = (counts[t] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([w]) => w);
}
