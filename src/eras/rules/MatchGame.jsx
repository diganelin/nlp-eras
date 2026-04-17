import { useMemo, useState } from "react";
import CodeBlock from "./CodeBlock.jsx";
import {
  RULES,
  TEACHING_IDS,
  EXTRA_IDS,
  TEACHING_SAMPLE_SIZE,
} from "./elizaRules.js";

const MAX_ROUNDS = 3;
const TEACHING_SET = new Set(TEACHING_IDS);

function pickRounds(transcript) {
  const exchanges = [];
  for (let i = 0; i < transcript.length - 1; i++) {
    const a = transcript[i];
    const b = transcript[i + 1];
    if (a.from === "user" && b.from === "bot") {
      const quizId = b.teachingRuleId || (TEACHING_SET.has(b.ruleId) ? b.ruleId : null);
      if (quizId) exchanges.push({ user: a.text, bot: b.text, ruleId: quizId });
    }
  }
  // De-duplicate by ruleId so we don't quiz on the same rule twice.
  const seen = new Set();
  const unique = exchanges.filter((e) => {
    if (seen.has(e.ruleId)) return false;
    seen.add(e.ruleId);
    return true;
  });
  const shuffled = [...unique].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, MAX_ROUNDS);
}

// Pick which teaching rules to display: always include the ones the student's
// chat actually triggered, then fill up to TEACHING_SAMPLE_SIZE with random others.
function pickDisplayedRules(transcript, teachingRules) {
  const usedIds = new Set();
  for (const m of transcript) {
    if (m.from === "bot") {
      const id = m.teachingRuleId || (TEACHING_SET.has(m.ruleId) ? m.ruleId : null);
      if (id) usedIds.add(id);
    }
  }
  const used = teachingRules.filter((r) => usedIds.has(r.id));
  const others = teachingRules.filter((r) => !usedIds.has(r.id));
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
  const fillCount = Math.max(0, TEACHING_SAMPLE_SIZE - used.length);
  const sample = [...used, ...shuffledOthers.slice(0, fillCount)];
  // Display in the original RULES order for stability.
  const sampleIds = new Set(sample.map((r) => r.id));
  return teachingRules.filter((r) => sampleIds.has(r.id));
}

export default function MatchGame({ transcript, onComplete }) {
  const rounds = useMemo(() => pickRounds(transcript), [transcript]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showExtras, setShowExtras] = useState(false);

  const teachingRules = useMemo(() => RULES.filter((r) => TEACHING_SET.has(r.id)), []);
  const extraRules = useMemo(() => RULES.filter((r) => EXTRA_IDS.includes(r.id)), []);
  // Sample of teaching rules to display, biased toward ones the student used.
  // Memoized on transcript so it's stable for the duration of the quiz.
  const displayedRules = useMemo(
    () => pickDisplayedRules(transcript, teachingRules),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const hiddenTeachingRules = teachingRules.filter(
    (r) => !displayedRules.some((d) => d.id === r.id),
  );

  if (rounds.length === 0) {
    return (
      <div className="match">
        <div className="match__prompt">
          <div className="match__line" style={{ color: "var(--text-muted)" }}>
            Keep talking with ELIZA in Step 1 and try different kinds of sentences, then come back here.
          </div>
        </div>
      </div>
    );
  }

  const round = rounds[roundIdx];
  const correctId = round.ruleId;
  const isCorrect = selectedId === correctId;
  const isWrong = selectedId && !isCorrect;

  const next = () => {
    if (roundIdx < rounds.length - 1) {
      setRoundIdx(roundIdx + 1);
      setSelectedId(null);
    } else {
      onComplete();
    }
  };

  return (
    <div className="match">
      <div className="match__prompt" style={{ position: "sticky", top: -16, zIndex: 1 }}>
        <div className="match__prompt-label">
          Round {roundIdx + 1} of {rounds.length} — Which rule produced this response?
        </div>
        <div className="match__exchange">
          <div className="match__line">
            <span className="match__line-label">YOU</span>
            {round.user}
          </div>
          <div className="match__line">
            <span className="match__line-label">ELIZA</span>
            {round.bot}
          </div>
        </div>

        {selectedId && (
          <div
            className={`match__feedback ${
              isCorrect ? "match__feedback--correct" : "match__feedback--wrong"
            }`}
            style={{ marginTop: 12 }}
          >
            <span>{isCorrect ? "Correct!" : "Not quite — try another."}</span>
            {isCorrect && (
              <button className="btn btn--primary" onClick={next}>
                {roundIdx < rounds.length - 1 ? "Next →" : "Continue"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="match__rules">
        {displayedRules.map((rule) => (
          <CodeBlock
            key={rule.id}
            rule={rule}
            selected={selectedId === rule.id}
            state={
              selectedId === rule.id
                ? (isCorrect ? "correct" : "wrong")
                : null
            }
            onClick={!isCorrect ? () => setSelectedId(rule.id) : undefined}
            readonly={isCorrect}
          />
        ))}

        <button
          className="btn btn--ghost"
          onClick={() => setShowExtras((v) => !v)}
          style={{ alignSelf: "flex-start", marginTop: 8 }}
        >
          {showExtras
            ? "Hide extra rules"
            : `Optional: show ${hiddenTeachingRules.length + extraRules.length} more rules ELIZA uses`}
        </button>

        {showExtras && (
          <>
            <div style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>
              The first group below uses the same simple syntax as above. The
              rest use a richer syntax we don't fully cover here (multiple
              wildcards, synonym groups like <code>@family</code>, numbered
              captures like <code>{`{2}`}</code>). Real ELIZA had about forty
              rules in total. They're shown here for the curious — they aren't
              part of the matching game.
            </div>
            {hiddenTeachingRules.map((rule) => (
              <CodeBlock key={rule.id} rule={rule} readonly />
            ))}
            {extraRules.map((rule) => (
              <CodeBlock key={rule.id} rule={rule} readonly />
            ))}
          </>
        )}
      </div>

    </div>
  );
}
