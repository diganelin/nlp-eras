import { useMemo, useState } from "react";
import CodeBlock from "./CodeBlock.jsx";
import { RULES } from "./elizaRules.js";
import { compileRules, parseStudentRule, respond } from "./elizaEngine.js";

const compiledBaseline = compileRules(RULES);

export default function BuildRule() {
  // Sub-step: 0 = sentence fill-in, 1 = code editor + test
  const [subStep, setSubStep] = useState(0);
  const [topic, setTopic] = useState("");
  const [reply, setReply] = useState("");

  const [code, setCode] = useState("");
  const [parseError, setParseError] = useState(null);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null); // { text, ruleId, matchedStudent }

  const startCoding = () => {
    if (!topic.trim() || !reply.trim()) return;
    setCode("");
    setSubStep(1);
  };

  const compiledWithStudent = useMemo(() => {
    if (subStep !== 1) return null;
    const parsed = parseStudentRule(code);
    if (parsed.error) return { error: parsed.error };
    // Student rule first so it always wins ties.
    return { rules: [parsed.rule, ...compiledBaseline], student: parsed.rule };
  }, [code, subStep]);

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
    setTestResult({
      text: r.text,
      ruleId: r.ruleId,
      matchedStudent: r.ruleId === "student",
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
      <div className="build__columns">
        <div className="build__column">
          <div className="build__column-title">Your rule</div>
          <div className="build__sentence" style={{ padding: 14, fontSize: 13 }}>
            <span style={{ color: "var(--text-muted)" }}>
              When I mention <strong style={{ color: "var(--text)" }}>{topic}</strong>,
              ELIZA should respond <strong style={{ color: "var(--text)" }}>"{reply}"</strong>
            </span>
          </div>
          <div className="build__tip">
            <strong>TIP:</strong> copy and edit a code block from the right.
          </div>
          <textarea
            className="build__editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder={`{\n    "pattern": "...",\n    "responses": [\n        "...",\n    ],\n},`}
          />
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
                  ? "✓ Your new rule matched."
                  : "Your new rule wasn't matched — another rule fired."}
              </div>
            </>
          )}
        </div>

        <div className="build__column">
          <div className="build__column-title">Reference rules (read-only)</div>
          <div className="build__reference">
            {RULES.map((rule) => (
              <CodeBlock key={rule.id} rule={rule} readonly />
            ))}
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
