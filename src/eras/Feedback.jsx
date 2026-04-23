import { useState } from "react";

// Google Form — "NLP Eras Feedback". Field IDs and section option labels are
// pulled from FB_PUBLIC_LOAD_DATA_ in the live viewform. If you change the
// form, re-fetch and update here.
const FORM_ID = "1FAIpQLSc6snNpjglUd0IzMxr1e6y2uq3vnUuLF6DmvopJJ5os5bPu0g";
const FORM_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

const ENTRY = {
  SECTION: "entry.276926472",
  REPORT:  "entry.1068859509",
  EMAIL:   "entry.153301494",
};

// These strings must match the options in the live Google Form exactly
// (Google validates dropdown submissions against the option list).
const SECTIONS = [
  "General",
  "1966: Rules for Language",
  "2002: Machine Learning with Language",
  "2013: Numbers Can Capture Meaning",
  "2018: Generalized Learning with Transformers",
  "2022: Fine-Tuning Transformers",
];

export default function Feedback() {
  const [section, setSection] = useState("General");
  const [report,  setReport]  = useState("");
  const [email,   setEmail]   = useState("");
  const [status,  setStatus]  = useState("idle");  // idle | sending | sent | error

  const submit = async (e) => {
    e.preventDefault();
    if (!report.trim()) return;
    setStatus("sending");

    const payload = new FormData();
    payload.append(ENTRY.SECTION, section);
    payload.append(ENTRY.REPORT,  report.trim());
    if (email.trim()) payload.append(ENTRY.EMAIL, email.trim());

    try {
      // Google Forms doesn't send CORS headers; we fire-and-forget with no-cors.
      // The row still lands in the sheet; we just can't read the response.
      await fetch(FORM_URL, { method: "POST", mode: "no-cors", body: payload });
      setStatus("sent");
      setReport("");
      setEmail("");
      setSection("General");
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="about feedback">
      <section className="about__section">
        <h3 className="about__h">Feedback</h3>
        <p className="about__sub">
          Spotted a glitch, confusing text, or something you liked? Drop a note. Anonymous is fine.
        </p>

        <form className="feedback__form" onSubmit={submit}>
          <label className="feedback__field">
            <span className="feedback__label">Which section?</span>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="feedback__select"
            >
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="feedback__field">
            <span className="feedback__label">Let me know what you liked or your suggestions for improvement</span>
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              rows={6}
              className="feedback__textarea"
              placeholder="What happened? What did you like? Anything confusing?"
              required
            />
          </label>

          <label className="feedback__field">
            <span className="feedback__label">Email (optional — only if you want a reply)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="feedback__input"
              placeholder="you@example.com"
            />
          </label>

          <div className="feedback__actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={status === "sending" || !report.trim()}
            >
              {status === "sending" ? "Sending…" : "Send →"}
            </button>
            {status === "sent" && (
              <span className="feedback__ok">Thanks — received.</span>
            )}
            {status === "error" && (
              <span className="feedback__err">Couldn't send. Try again?</span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
