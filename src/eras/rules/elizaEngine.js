import { PRONOUN_SWAPS, PRES, SYNONYMS } from "./elizaRules.js";

// ── DSL pattern compiler ─────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

// Compile a DSL pattern string into a RegExp with positional captures.
// Supported tokens:
//   *           — wildcard, captures
//   @key        — synonym group (from SYNONYMS), captures
//   (a OR b)    — alternation, captures matched word
//   word OR word — bare alternation (whole pattern, non-capturing)
//   word        — literal word
export function compilePattern(dsl, synonyms = SYNONYMS) {
  const t = (dsl || "").trim();
  if (!t) throw new Error("Empty pattern");

  // Bare alternation (no parens, no wildcards/synonyms)
  if (/\s+OR\s+/.test(t) && !/[*@()]/.test(t)) {
    const alts = t.split(/\s+OR\s+/).map((a) => a.trim()).filter(Boolean);
    return {
      regex: new RegExp(`\\b(?:${alts.map(escapeRegex).join("|")})\\b`, "i"),
      captureCount: 0,
    };
  }

  // Tokenize
  const tokens = [];
  let i = 0;
  while (i < t.length) {
    const ch = t[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === "*") { tokens.push({ type: "wild" }); i++; continue; }
    if (ch === "@") {
      let j = i + 1;
      while (j < t.length && /[A-Za-z]/.test(t[j])) j++;
      const key = t.slice(i + 1, j);
      if (!key) throw new Error("Empty @synonym key");
      tokens.push({ type: "synon", key });
      i = j;
      continue;
    }
    if (ch === "(") {
      const close = t.indexOf(")", i);
      if (close === -1) throw new Error("Unmatched '(' in pattern");
      const inner = t.slice(i + 1, close);
      const alts = inner.split(/\s+OR\s+/).map((a) => a.trim()).filter(Boolean);
      if (!alts.length) throw new Error("Empty alternation");
      tokens.push({ type: "alt", alts });
      i = close + 1;
      continue;
    }
    // literal word: take until whitespace or special
    let j = i;
    while (j < t.length && !/\s/.test(t[j]) && !"*@(".includes(t[j])) j++;
    if (j === i) j++;
    tokens.push({ type: "word", word: t.slice(i, j) });
    i = j;
  }

  // Build regex. Last wildcard is greedy; others lazy. Insert \s+ between
  // adjacent literal/group tokens.
  let captureCount = 0;
  const lastWildIdx = (() => {
    for (let k = tokens.length - 1; k >= 0; k--) if (tokens[k].type === "wild") return k;
    return -1;
  })();

  const parts = [];
  for (let k = 0; k < tokens.length; k++) {
    const tok = tokens[k];
    const prev = tokens[k - 1];
    if (tok.type === "wild") {
      const greedy = k === lastWildIdx;
      parts.push(greedy ? "\\s*(.*)" : "\\s*(.*?)\\s*");
      captureCount++;
    } else if (tok.type === "synon") {
      if (prev && prev.type !== "wild") parts.push("\\s+");
      const list = synonyms[tok.key] || [tok.key];
      parts.push(`\\b(${list.map(escapeRegex).join("|")})\\b`);
      captureCount++;
    } else if (tok.type === "alt") {
      if (prev && prev.type !== "wild") parts.push("\\s+");
      parts.push(`\\b(${tok.alts.map(escapeRegex).join("|")})\\b`);
      captureCount++;
    } else if (tok.type === "word") {
      if (prev && prev.type !== "wild") parts.push("\\s+");
      parts.push(`\\b${escapeRegex(tok.word)}\\b`);
    }
  }

  return { regex: new RegExp(parts.join(""), "i"), captureCount };
}

// ── Pronoun swap ─────────────────────────────────────────

export function swapPronouns(text) {
  return text.replace(/[\w']+/g, (word) => {
    const lower = word.toLowerCase();
    return Object.prototype.hasOwnProperty.call(PRONOUN_SWAPS, lower)
      ? PRONOUN_SWAPS[lower]
      : word;
  });
}

// ── Compile rules ────────────────────────────────────────
// Accepts both shapes:
//   { id, pattern, responses, rank? }                          (simple)
//   { id, key?, rank?, decomps: [{pattern, responses, memory?}] } (multi)

function compileDecomp(d, synonyms) {
  const { regex, captureCount } = compilePattern(d.pattern, synonyms);
  return {
    pattern: d.pattern,
    responses: d.responses,
    memory: !!d.memory,
    regex,
    captureCount,
    _lastChoice: -1,
  };
}

export function compileRules(rules, synonyms = SYNONYMS) {
  const compiled = rules.map((r, originalIdx) => {
    let decomps;
    if (r.decomps) {
      decomps = r.decomps.map((d) => compileDecomp(d, synonyms));
    } else {
      const patterns = Array.isArray(r.pattern) ? r.pattern : [r.pattern];
      decomps = patterns.map((p) => compileDecomp({ pattern: p, responses: r.responses }, synonyms));
    }
    return {
      id: r.id,
      key: r.key || null,
      rank: r.rank || 0,
      decomps,
      _origIdx: originalIdx,
    };
  });
  // Sort by rank descending, then by original order
  compiled.sort((a, b) => b.rank - a.rank || a._origIdx - b._origIdx);
  return compiled;
}

// ── Stateless single-shot response (used by BuildRule for tests) ─

export function respond(input, compiledRules) {
  const bot = createBot(compiledRules);
  return bot.transform(input);
}

// ── Find which rule WOULD fire (no memory, no goto, no return) ──
// Used by MatchGame to quiz on the teaching subset, regardless of which
// rich rule the live engine actually picked.

export function findFirstMatch(input, compiledRules) {
  let text = (input || "").toLowerCase();
  text = text.replace(/[@#$%^&*()_+=~`{[\]}|:<>\/\\\t]/g, " ");
  text = text.replace(/\s+-+\s+/g, ".");
  text = text.replace(PUNCT_RE, ".");
  text = text.replace(BUT_RE, ".");
  text = text.replace(/\s{2,}/g, " ").trim();
  const parts = text.split(".").map((p) => p.trim()).filter(Boolean);

  for (const rawPart of parts) {
    const part = applyPres(rawPart);
    for (const rule of compiledRules) {
      if (rule.key) {
        if (!new RegExp(`\\b${escapeRegex(rule.key)}\\b`, "i").test(part)) continue;
      }
      for (const decomp of rule.decomps) {
        if (decomp.regex.test(part)) return rule.id;
      }
    }
  }
  return null;
}

// ── Stateful bot (used by Chat) ──────────────────────────

const MEM_SIZE = 20;
const PUNCT_RE = /\s*[,\.\?!;]+\s*/g;
const BUT_RE = /\s+\bbut\b\s+/g;

function applyPres(s) {
  let out = s;
  for (const [from, to] of PRES) {
    out = out.replace(new RegExp(`\\b${escapeRegex(from)}\\b`, "g"), to);
  }
  return out;
}

function postClean(s) {
  return s
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.!?,;])/g, "$1")
    .trim();
}

function capitalize(s) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

export function createBot(compiledRules) {
  const state = { mem: [] };
  const ruleById = new Map(compiledRules.map((r) => [r.id, r]));
  const ruleByKey = new Map();
  for (const r of compiledRules) {
    if (r.key && !ruleByKey.has(r.key)) ruleByKey.set(r.key, r);
  }

  function execRule(rule, sentence, gotoDepth = 0) {
    if (gotoDepth > 8) return null;
    for (const decomp of rule.decomps) {
      const m = sentence.match(decomp.regex);
      if (!m) continue;
      // Round-robin choose response
      decomp._lastChoice = (decomp._lastChoice + 1) % decomp.responses.length;
      let rpl = decomp.responses[decomp._lastChoice];

      // goto chaining
      const gotoMatch = rpl.match(/^goto\s+(\S+)$/i);
      if (gotoMatch) {
        const target = ruleById.get(gotoMatch[1]) || ruleByKey.get(gotoMatch[1]);
        if (target) {
          const sub = execRule(target, sentence, gotoDepth + 1);
          if (sub) return sub;
        }
        continue;
      }

      // Substitute captures with pronoun-swapped text.
      // {USERTEXT} is the friendly alias for capture group 1 (the only
      // capture in simple-DSL teaching rules). {N} is for multi-capture
      // patterns in the richer extras.
      const subst = (n) => {
        const cap = m[n];
        if (cap == null) return "";
        return swapPronouns(cap.trim().replace(/[.!?,;]+$/, ""));
      };
      rpl = rpl.replace(/\{USERTEXT\}/g, () => subst(1));
      rpl = rpl.replace(/\{(\d+)\}/g, (_, n) => subst(parseInt(n, 10)));

      const finalText = capitalize(postClean(rpl));

      if (decomp.memory) {
        // Save for later, keep looking for a real reply.
        state.mem.push({ text: finalText, ruleId: rule.id });
        if (state.mem.length > MEM_SIZE) state.mem.shift();
        continue;
      }
      return { text: finalText, ruleId: rule.id, captured: m[1] || "" };
    }
    return null;
  }

  function transform(input) {
    // Normalize input: lowercase, strip junk, split on punctuation/but
    let text = (input || "").toLowerCase();
    text = text.replace(/[@#$%^&*()_+=~`{[\]}|:<>\/\\\t]/g, " ");
    text = text.replace(/\s+-+\s+/g, ".");
    text = text.replace(PUNCT_RE, ".");
    text = text.replace(BUT_RE, ".");
    text = text.replace(/\s{2,}/g, " ").trim();

    const parts = text.split(".").map((p) => p.trim()).filter(Boolean);

    for (const rawPart of parts) {
      const part = applyPres(rawPart);
      for (const rule of compiledRules) {
        if (rule.key) {
          if (!new RegExp(`\\b${escapeRegex(rule.key)}\\b`, "i").test(part)) continue;
        }
        const result = execRule(rule, part);
        if (result) return result;
      }
    }

    // Nothing matched — try memory
    if (state.mem.length) {
      const idx = Math.floor(Math.random() * state.mem.length);
      const [m] = state.mem.splice(idx, 1);
      return { text: m.text, ruleId: m.ruleId, captured: "" };
    }

    // Fall back to xnone
    const xnone = ruleById.get("xnone") || ruleByKey.get("xnone");
    if (xnone) {
      const result = execRule(xnone, "");
      if (result) return result;
    }
    return { text: "Please tell me more.", ruleId: "fallback", captured: "" };
  }

  function getInitial() {
    // INITIALS handled in Chat.jsx; bot reset on demand
  }

  function reset() {
    state.mem = [];
    for (const rule of compiledRules) {
      for (const d of rule.decomps) d._lastChoice = -1;
    }
  }

  return { transform, getInitial, reset, get mem() { return state.mem; } };
}

// ── Parse a student-written rule from Python-ish source ──

export function parseStudentRule(source) {
  const src = (source || "").trim();
  if (!src) return { error: "Couldn't parse rule! Empty." };

  const patternMatch = src.match(/["']pattern["']\s*:\s*["']([^"']*)["']/);
  if (!patternMatch) return { error: "Couldn't parse rule! Missing 'pattern'." };

  const respMatch = src.match(/["']responses["']\s*:\s*\[([\s\S]*?)\]/);
  if (!respMatch) return { error: "Couldn't parse rule! Missing 'responses'." };

  const responses = Array.from(respMatch[1].matchAll(/["']([^"']*)["']/g))
    .map((m) => m[1])
    .filter((s) => s.length > 0);

  if (responses.length === 0) {
    return { error: "Couldn't parse rule! No responses found." };
  }

  const pattern = patternMatch[1];
  if (!pattern.trim()) return { error: "Couldn't parse rule! Empty pattern." };

  try {
    compilePattern(pattern);
    return {
      rule: { id: "student", pattern, responses },
    };
  } catch (e) {
    return { error: "Couldn't parse rule! Check pattern syntax." };
  }
}

// ── Render a rule object as Python-style source text ──

export function ruleToSource(rule) {
  const lines = [];
  lines.push("{");
  if (rule.decomps && rule.decomps.length > 1) {
    if (rule.key) lines.push(`    "key": ${JSON.stringify(rule.key)},`);
    lines.push(`    "decomps": [`);
    for (const d of rule.decomps) {
      lines.push(`        {`);
      // Pattern always on one line (even if authored as a list, collapse).
      const pStr = Array.isArray(d.pattern) ? JSON.stringify(d.pattern) : JSON.stringify(d.pattern);
      lines.push(`            "pattern": ${pStr},`);
      if (d.memory) lines.push(`            "memory": True,`);
      lines.push(`            "responses": [`);
      for (const r of d.responses) {
        lines.push(`                ${JSON.stringify(r)},`);
      }
      lines.push(`            ],`);
      lines.push(`        },`);
    }
    lines.push(`    ],`);
  } else {
    const ds = rule.decomps || [rule];
    const rawPatterns = ds.length > 1
      ? ds.map((d) => d.pattern)
      : (Array.isArray(ds[0].pattern || rule.pattern)
          ? (ds[0].pattern || rule.pattern)
          : [ds[0].pattern || rule.pattern]);
    // Pattern always on one line — either a single string or a JSON array literal.
    const patternValue = rawPatterns.length > 1
      ? JSON.stringify(rawPatterns)
      : JSON.stringify(rawPatterns[0]);
    lines.push(`    "pattern": ${patternValue},`);
    lines.push(`    "responses": [`);
    for (const r of (ds[0].responses || rule.responses)) {
      lines.push(`        ${JSON.stringify(r)},`);
    }
    lines.push(`    ],`);
  }
  lines.push("},");
  return lines.join("\n");
}
