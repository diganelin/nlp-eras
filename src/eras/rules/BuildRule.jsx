import { useEffect, useMemo, useRef, useState } from "react";
import CodeBlock from "./CodeBlock.jsx";
import { RULES, TEACHING_IDS, EXTRA_IDS } from "./elizaRules.js";
import { compileRules, parseStudentRule, respond } from "./elizaEngine.js";

const compiledBaseline = compileRules(RULES);
const TEACHING_SET = new Set(TEACHING_IDS);
const EXTRA_SET = new Set(EXTRA_IDS);

export default function BuildRule() {
  // Sub-step: 0 = sentence fill-in, 1 = code editor + test
  const [subStep, setSubStep] = useState(0);
  const [topic, setTopic] = useState("");
  const [reply, setReply] = useState("");

  const [codes, setCodes] = useState([""]);
  const [parseError, setParseError] = useState(null);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null); // { text, ruleId, matchedStudent }
  const [showExtras, setShowExtras] = useState(false);
  const [leftPct, setLeftPct] = useState(55);
  const columnsRef = useRef(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current || !columnsRef.current) return;
      const rect = columnsRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(80, Math.max(20, pct)));
    };
    const onUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startDrag = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const teachingRules = RULES.filter((r) => TEACHING_SET.has(r.id));
  const extraRules = RULES.filter((r) => EXTRA_SET.has(r.id));

  const setCodeAt = (idx, value) => {
    setCodes((cs) => cs.map((c, i) => (i === idx ? value : c)));
  };
  const addCodeBlock = () => setCodes((cs) => [...cs, ""]);
  const removeCodeBlock = (idx) =>
    setCodes((cs) => (cs.length === 1 ? cs : cs.filter((_, i) => i !== idx)));

  const startCoding = () => {
    if (!topic.trim() || !reply.trim()) return;
    setCodes([""]);
    setSubStep(1);
  };

  const compiledWithStudent = useMemo(() => {
    if (subStep !== 1) return null;
    const rawStudent = [];
    for (let i = 0; i < codes.length; i++) {
      const src = codes[i].trim();
      if (!src) continue;
      const parsed = parseStudentRule(src);
      if (parsed.error) return { error: `Block ${i + 1}: ${parsed.error}` };
      rawStudent.push({ ...parsed.rule, id: `student-${i}` });
    }
    if (rawStudent.length === 0) return { error: "Write at least one rule." };
    const compiledStudent = compileRules(rawStudent);
    // Student rules first so they always win ties; first-written wins among themselves.
    return {
      rules: [...compiledStudent, ...compiledBaseline],
      studentIds: rawStudent.map((r) => r.id),
    };
  }, [codes, subStep]);

  const runTest = () => {
    setParseError(null);
    setTestResult(null);
    if (!compiledWithStudent) return;
    if (compiledWithStudent.error) {
      setParseError(compiledWithStudent.error);
      return;
    }
    if (!testInput.trim()) return;
    const r = respond(testInput, compiledWithStudent.rules);
    const inputLc = testInput.toLowerCase();
    const replyLc = r.text.toLowerCase();
    setTestResult({
      text: r.text,
      ruleId: r.ruleId,
      matchedStudent: compiledWithStudent.studentIds.includes(r.ruleId),
      topicMentioned: !!topic.trim() && inputLc.includes(topic.toLowerCase().trim()),
      goalMet: !!reply.trim() && replyLc.includes(reply.toLowerCase().trim()),
    });
  };

  if (subStep === 0) {
    return (
      <div className="build">
        <div className="build__sentence">
          <span>When I mention</span>
          <input
            className="build__input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. school"
            autoFocus
          />
          <span>, ELIZA should respond</span>
          <input
            className="build__input"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="e.g. How do you feel about school?"
            style={{ minWidth: 280 }}
          />
        </div>
        <div className="stage-footer">
          <span className="stage-footer__hint">
            Define what you want first. You'll write the code next.
          </span>
          <button
            className="btn btn--primary"
            onClick={startCoding}
            disabled={!topic.trim() || !reply.trim()}
          >
            Start coding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="build">
      <div
        className="build__columns"
        ref={columnsRef}
        style={{ gridTemplateColumns: `${leftPct}fr 6px ${100 - leftPct}fr`, gap: 12 }}
      >
        <div className="build__column" style={{ minWidth: 0 }}>
          <div className="build__column-title">Your rule</div>
          <div className="build__sentence" style={{ padding: 14, fontSize: 13 }}>
            <span style={{ color: "var(--text-muted)" }}>
              When I mention <strong style={{ color: "var(--text)" }}>{topic}</strong>,
              ELIZA should respond <strong style={{ color: "var(--text)" }}>"{reply}"</strong>
            </span>
          </div>
          <div className="build__tip">
            <strong>TIP:</strong> drag a code block from the right (or copy it),
            then edit.
          </div>
          {codes.map((code, idx) => (
            <div key={idx} style={{ position: "relative", display: "flex" }}>
              <textarea
                className="build__editor"
                style={{ flex: 1, width: "100%", boxSizing: "border-box" }}
                value={code}
                onChange={(e) => setCodeAt(idx, e.target.value)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(e) => {
                  const dropped = e.dataTransfer.getData("text/plain");
                  if (!dropped) return;
                  e.preventDefault();
                  setCodeAt(idx, dropped);
                }}
                spellCheck={false}
                placeholder={`{\n    "pattern": "...",\n    "responses": [\n        "...",\n    ],\n},`}
              />
              {codes.length > 1 && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => removeCodeBlock(idx)}
                  title="Remove this rule"
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    fontSize: 12,
                    padding: "2px 8px",
                    opacity: 0.7,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={addCodeBlock}
            style={{ alignSelf: "flex-start", fontSize: 13 }}
          >
            + write more code blocks
          </button>
          {parseError && <div className="build__error">{parseError}</div>}

          <form
            className="build__actions"
            onSubmit={(e) => {
              e.preventDefault();
              runTest();
            }}
          >
            <input
              className="chat__input"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Try it: type a test message…"
            />
            <button type="submit" className="btn btn--primary">Run</button>
          </form>

          {testResult && (
            <>
              <div className="chat__msg chat__msg--bot" style={{ alignSelf: "flex-start" }}>
                {testResult.text}
              </div>
              <div
                className={`build__matched ${
                  testResult.matchedStudent ? "build__matched--yes" : "build__matched--no"
                }`}
              >
                {testResult.matchedStudent
                  ? "✓ Your new rule fired."
                  : "✗ Your new rule didn't fire — another rule matched first."}
              </div>
              <div
                className={`build__matched ${
                  testResult.goalMet ? "build__matched--yes" : "build__matched--no"
                }`}
              >
                {!testResult.topicMentioned
                  ? `(Your test didn't mention "${topic}", so the goal wasn't really tested.)`
                  : testResult.goalMet
                  ? `✓ ELIZA responded with "${reply}" as planned.`
                  : `✗ ELIZA didn't respond with "${reply}".`}
              </div>
            </>
          )}
        </div>

        <div
          onMouseDown={startDrag}
          title="Drag to resize"
          style={{
            cursor: "col-resize",
            background: "var(--border)",
            borderRadius: 3,
            alignSelf: "stretch",
          }}
        />

        <div className="build__column" style={{ minWidth: 0 }}>
          <div className="build__column-title">Reference rules (read-only)</div>
          <div className="build__reference">
            {teachingRules.map((rule) => (
              <CodeBlock key={rule.id} rule={rule} readonly draggable />
            ))}
            <button
              className="btn btn--ghost"
              onClick={() => setShowExtras((v) => !v)}
              style={{ alignSelf: "flex-start" }}
            >
              {showExtras
                ? "Hide extra rules"
                : `Optional: show ${extraRules.length} more rules ELIZA uses`}
            </button>
            {showExtras && (
              <>
                <div style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>
                  These use a richer pattern syntax (multiple wildcards, synonym
                  groups, numbered captures). Stick with the simple syntax above
                  for your own rule.
                </div>
                {extraRules.map((rule) => (
                  <CodeBlock key={rule.id} rule={rule} readonly />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="stage-footer">
        <button className="btn btn--ghost" onClick={() => setSubStep(0)}>
          ← Back to spec
        </button>
        <span className="stage-footer__hint">
          Use the mini-language: <code>OR</code>, <code>*</code>, <code>(...)</code>.
        </span>
      </div>
    </div>
  );
}
