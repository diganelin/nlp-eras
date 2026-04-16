import { PRONOUN_SWAPS } from "./elizaRules.js";

// ── DSL pattern compiler ─────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

// Compile a DSL pattern string into a RegExp.
// Returns { regex, kind } where kind is one of:
//   "fallback" | "group" | "wildcard" | "alt" | "literal"
export function compilePattern(dsl) {
  const t = dsl.trim();

  if (t === "*") {
    return { regex: /^(.*)$/i, kind: "fallback" };
  }

  // (a OR b OR c) — captured alternation
  const paren = t.match(/^\((.+)\)$/);
  if (paren) {
    const alts = paren[1].split(/\s+OR\s+/).map((a) => escapeRegex(a.trim()));
    if (alts.some((a) => !a)) throw new Error("Empty alternation");
    return { regex: new RegExp(`\\b(${alts.join("|")})\\b`, "i"), kind: "group" };
  }

  // ...phrase * — wildcard capture at the end
  if (t.endsWith(" *")) {
    const prefix = t.slice(0, -2).trim();
    if (!prefix) throw new Error("Empty prefix before *");
    const parts = prefix.split(/\s+/).map(escapeRegex);
    return {
      regex: new RegExp(`\\b${parts.join("\\s+")}\\s+(.+)$`, "i"),
      kind: "wildcard",
    };
  }

  // word OR word — non-capturing alternation
  if (/\s+OR\s+/.test(t)) {
    const alts = t.split(/\s+OR\s+/).map((a) => escapeRegex(a.trim()));
    if (alts.some((a) => !a)) throw new Error("Empty alternation");
    return { regex: new RegExp(`\\b(?:${alts.join("|")})\\b`, "i"), kind: "alt" };
  }

  // single literal word/phrase
  const parts = t.split(/\s+/).map(escapeRegex);
  return {
    regex: new RegExp(`\\b${parts.join("\\s+")}\\b`, "i"),
    kind: "literal",
  };
}

// ── Pronoun swap (single-pass) ───────────────────────────

export function swapPronouns(text) {
  return text.replace(/\b\w+\b/g, (word) => {
    const lower = word.toLowerCase();
    return Object.prototype.hasOwnProperty.call(PRONOUN_SWAPS, lower)
      ? PRONOUN_SWAPS[lower]
      : word;
  });
}

// ── Compile rules at load time ───────────────────────────

export function compileRules(rules) {
  return rules.map((r) => ({ ...r, ...compilePattern(r.pattern), _nextIdx: 0 }));
}

// ── Match input against rule list, return response + which rule fired ──
// Uses round-robin per rule so responses cycle instead of repeating.

export function respond(input, compiledRules) {
  const cleaned = input.trim();
  for (const rule of compiledRules) {
    const m = cleaned.match(rule.regex);
    if (m) {
      const captured = m[1] ? swapPronouns(m[1].trim().replace(/[.!?]+$/, "")) : "";
      const idx = (rule._nextIdx || 0) % rule.responses.length;
      rule._nextIdx = idx + 1;
      const tpl = rule.responses[idx];
      const text = tpl.replace(/\{1\}/g, captured);
      return { text, ruleId: rule.id, captured };
    }
  }
  return { text: "Please tell me more.", ruleId: "fallback", captured: "" };
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
    const compiled = compilePattern(pattern);
    return {
      rule: {
        id: "student",
        pattern,
        responses,
        regex: compiled.regex,
        kind: compiled.kind,
      },
    };
  } catch (e) {
    return { error: "Couldn't parse rule! Check pattern syntax." };
  }
}

// ── Render a rule object as Python-style source text ──

export function ruleToSource(rule) {
  const lines = [];
  lines.push("{");
  lines.push(`    "pattern": ${JSON.stringify(rule.pattern)},`);
  lines.push(`    "responses": [`);
  for (const r of rule.responses) {
    lines.push(`        ${JSON.stringify(r)},`);
  }
  lines.push(`    ],`);
  lines.push("},");
  return lines.join("\n");
}
