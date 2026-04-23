# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

Interactive webapp lesson on NLP for high schoolers, tracing how machines learned language. React + Vite, hosted on Vercel. Light theme (warm off-white, dark orange accents). Live at https://nlp-eras.vercel.app/.

## Student Background

High schoolers. Assume:
- Basic Python literacy
- Basic ML concepts (training set, test set, accuracy, the rough idea of a model)
- **New to NLP** — introduce NLP concepts carefully from first principles
- No regex, no calculus assumed

## Pedagogical Approach

- **Discovery-oriented**: let students interact first; avoid explaining internals upfront. Intros set historical context, not mechanics.
- **Not preachy**: avoid "The problem:" / "Designer's pick:" closers. Pose a question, not a conclusion. No grading unless the activity is explicitly a quiz.
- **Plain language**: replace jargon with everyday words. "score" not "weight". "low-meaning words" not "stopwords" in student-facing copy.
- **Stay at the task level**: describe *what task the model does* and *what it learned*, never architecture internals (attention heads, hidden states, layer math).

## Storyline — five eras (1-indexed, by date)

Numbering below matches user-facing era numbers.

| # | Era label | Year | Big idea | id in code |
|---|-----------|------|----------|------------|
| 1 | Rules for Language | 1966 | Hand-craft rules | `rules` |
| 2 | Machine Learning with Language | 2002 | Text → numbers → ML | `ml` |
| 3 | Numbers Can Capture Meaning | 2013 | Words as vectors | `embeddings` |
| 4 | Generalized Learning with Transformers | 2018 | Pretrain to predict next word | `generative` |
| 5 | Fine-Tuning Transformers | 2022 | Extra training on top of pretraining | `traininghard` |

The internal `id`s (`rules`, `ml`, `embeddings`, `generative`, `traininghard`) pre-date the current labels and should not be renamed.

Era metadata (label, year, bigIdea, motivation, activity, newIdea, remainingProblems) lives in `src/erasData.js`. Used by sidebar intro, Begin gate, and `EraRecap`.

## App shell

- `src/App.jsx` — sidebar with era tabs, About + Feedback links, active-era intro block, lock-toast, Begin gate.
  - **Mount-all-eras**: every era component is rendered once and toggled with CSS (`.era-slot[data-active]`). React state (step progress, picks, votes) persists across tab switches.
  - **Begin gate**: first visit to an era shows a centered card with eyebrow `Era N · YEAR`, title, bigIdea, motivation, activity, and a big "Begin Era N →" button. Dismiss state is in-memory only (resets on reload).
  - **Lock toast**: stepper tabs dispatch a `nlp:locked` CustomEvent when a disabled tab is clicked; App shows a toast.
- `src/erasData.js` — single source of truth for era metadata.
- `src/components/EraRecap.jsx` — two-box "Our new idea / Remaining problems" component; final stage of every era.
- `src/eras/About.jsx` — tagline, summary, credits, per-era sources with "What we edited" notes. One-sentence realism disclaimer above sources.
- `src/eras/Feedback.jsx` — simple form POSTing to a Google Form (`FORM_ID` + `ENTRY` map at top of file). Validates against live form option labels exactly. Submits with `mode: 'no-cors'`.

## Dev Commands

```bash
npm install
npm run dev        # Vite dev server (localhost:5173)
npm run build
```

## Per-era notes

### Era 1 — Rules for Language (ELIZA)
- `src/eras/Rules.jsx` — panel, 3-stage activity (chat → match → build).
- `src/eras/rules/` — `elizaEngine.js`, `elizaRules.js`, `Chat.jsx`, `MatchGame.jsx`, `BuildRule.jsx`, `CodeBlock.jsx`.
- ELIZA rules displayed as Python (students know Python); engine runs in JS.
- Custom mini-DSL: `*`, `OR`, `(...)` capture — avoids teaching regex.
- Student-written rules match first so they always fire over builtins.
- Tokenization explicitly skipped.
- `Chat.jsx` has a "Skip ahead →" button (prebuilds a seeded conversation).

### Era 2 — Machine Learning with Language (spam classification)
- `src/eras/MLLanguage.jsx` — panel, 5 steps (label → train → test → retrain → recap).
- `src/eras/ml/` — `corpus.json`, `smsData.js` (incl. `LABELING_POOL` + `STOPWORDS`), `classifier.js`, `Phone.jsx`, `Label.jsx`, `Train.jsx`, `Test.jsx`, `Retrain.jsx`.
- Bag-of-words log-odds: `score = log((spam_count+1)/(legit_count+1))`. Training uses document frequency; classification uses term frequency (×count per word).
- Hand-curated labeling pairs are separate from the 500/100 train/test split; designed to escalate difficulty (easy spam → service-text legits that share spam vocab).
- `Train.jsx` animation is ~20s. Phases: read 500 → count → score → run sample. `animKey`-gated `useEffect` supports "↻ Replay animation". NN-diagram inputs show **token counts** from the sample (not binary presence) so "free" appearing twice shows `2`, consistent with classification.
- `Retrain.jsx` Step 4 ("Use 100 Words") has a "Try a message of your own" classifier at the bottom — live classify + word-hit chips.
- User-facing copy says "**low-meaning words**" rather than "stopwords".
- Skip-ahead buttons appear after **at least 3 rounds** completed.
- Label step's bag-of-words card holds the "we count how often each shows up in spam vs legit" explainer inline (not at top).

### Era 3 — Numbers Can Capture Meaning (word vectors, tweet sentiment)
- `src/eras/Embeddings.jsx` — panel, 6 steps (place → vectorize → mini → scale → classify → recap).
- `src/eras/embeddings/` — `data.js`, `era2_bundle.json`, `vectors_25d.json`, plus per-step components.
- Stage 1 (`Place.jsx`): 9 emotion words (excited, pumped, cozy, content, tired, bored, drained, furious, annoyed). Each word is tagged with a known semantic quadrant (energy × valence) in `SEMANTIC`. Picked so they recur in later-stage tweets.
- Stage 1 staged instructions: "words in blue → fill blanks" then "drag words onto grid".
- Placed chips are **draggable to reposition**; double-click removes.
- "Skip ahead — auto-place the rest →" appears only once we can infer the student's axis orientation (`inferSigns()` — requires placements in two adjacent non-diagonal quadrants with ≥0.15 mean separation on both axes). Remaining words are scattered into the matching quadrant under the student's axes.
- Tweets (Sentiment140), GloVe vectors (25d subset of Stanford's Twitter GloVe). Classifier trained live in browser.

### Era 4 — Generalized Learning with Transformers (pretraining)
- `src/eras/Generalized.jsx` — panel, 4 steps (predict → train-anim → tag → recap).
- `src/eras/generalized/` — `predictData.js`, `tagData.js` (+ `raw/gpt2_attn_real.json`), `Predict.jsx`, `TrainAnim.jsx`, `Tag.jsx`.
- Word-level throughout, not char-level.
- **Staged Predict flow**: Stage A type guess + Submit, Stage B click 1–3 words the model "pays attention to", Stage C reveal. "Pay attention" phrasing used consistently in this era.
- `TrainAnim.jsx`: nested boxes labeled "Huge specialized Transformer model" → "transformer layer" → "× many layers". Predict-word chip sits to the right of the model with a `→` arrow; both sit above a data-center rack strip. `PREDICT_WORDS` is weighted toward boring high-frequency words (the, and, of…) with a minority of interesting ones, because that's what LMs actually predict. Replay + Skip buttons.
- `Tag.jsx` state is **lifted to `Generalized.jsx`** (`tagVotes`, `tagActiveId`, `tagGenStep`) so ratings persist when the student jumps to Recap and back.
- Tag UI: pick an example → watch generation → read inline italicized question "How did the model do on **X**? **Y**? **Z**?" (from each pair's `notice` list, tailored per example) → 5-face emoji scale (😢 😕 😐 🙂 😄) → designer's takeaway note reveals.
- GPT-2 small outputs run locally + the 1.5B "unicorn" sample. Attention highlighting is illustrative (real GPT-2 attention piles onto position-0 sink; not pedagogical raw).

### Era 5 — Fine-Tuning Transformers
- `src/eras/TrainingHard.jsx` — 4 steps (RLHF → code feedback → security check → recap).
- `src/eras/traininghard/` — `RLHF.jsx`, `rlhfData.js`, `CodeFeedback.jsx`, `codeFeedbackData.js`, `Jailbreak.jsx`, `jailbreakData.js`.
- Each stage opens with a "Your role" placard containing a bulleted `thard-role-list`. No separate intro `gen__prompt` block (kept tight).
- **Stage 1 (RLHF, 2022)**: student plays Amina, Nairobi, Kenya contract worker — $1.32/hr, $0.02/comparison. Contractor (Sama) **not named in-game**, only in About sources. Worker sidebar lists "Maria Elena (Caracas) · Priya (Bangalore) · Jorge (Manila)". 12 shuffled rounds across advice/health/math/politics/factual/creative, including 2 multi-turn conversations. Flags: Violent/Biased/Privacy/Misleading. Picks + flags are independent, no designer's-pick reveal. Skip-ahead after round 4+.
- **Stage 2 (Code Feedback, 2024)**: 4 problems shuffled. "▶ ran Python code" boxes are the tool-use demo. Env stats sidebar ticks up per problem. `Automation` screen (after the last problem) now leads with a short "Why this scales: code grades itself" blurb — moved out of the stage header so the problems stay uncluttered. `AUTOMATION_STATS`: 500M rollouts, 1.5 GWh, 2.7M L cooling water (order-of-magnitude estimates, sourced in About).
- **Stage 3 (Security check, 2026)**: jailbreak tree. `jailbreakData.js` has 4 root paths:
  - **blunt**: quick refusal
  - **owner (lockout)**: legitimate help path (real Instagram recovery steps, memorial form, etc.) — ends `legitimate`
  - **grief → partial_unlock**: the one path that "works". New flow: user triggers "I have her password but can't get past 2FA" → AI asks for a phone number → **`inputType: 'phone'` user node** — student types anything into `thard-jb-input` → AI narrates a workaround and **asks "want me to go ahead?"** → student confirms ("Yes — go ahead" or "Stop" which routes to `self_correct`) → 3 chip-narrated exec steps → fake session link + recovery code. Terminal has two variants: "Thanks, I got in!" / "Done — that worked."
  - **parent → self_correct**: AI catches itself mid-reasoning and declines.
- All "unlock" narration uses vague verbs; no real exploit technique.
- "Wrap up" button lives **below** the chat frame (`.thard-jb-wrapup-row`), not in the header. Always available mid-conversation. Clicking with no terminal reached sets `endingType = 'wrapped_unresolved'` → "Did not break in." banner.
- Outcome banner wording: "You broke in." (partial_unlock) / "Didn't break in — AI kept you on the safe path." (legitimate) / "Did not break in." + encouraging note for refused/self_correct/wrapped_unresolved.
- Simulated AI responses throughout. Tool chips ("Searching web…", "Connecting to Instagram…") are fake — framed to students as "tool calls today's AI might use".
- Recap's newIdea closes with: "today's models are powerful enough that this web app's code was written entirely by AI."

## Sources and authenticity

- **Era 1**: ELIZA patterns in the spirit of Weizenbaum 1966; rule set expanded; JS mini-DSL instead of MAD-SLIP regexes.
- **Era 2**: Real UCI SMS Spam Collection (500/100 balanced subset, explicit filtered out). Classifier trained live. Paul Graham 2002 "A Plan for Spam" cited as the anchor year.
- **Era 3**: Real Sentiment140 tweets (English, HTML-decoded, explicit filtered). 25d GloVe Twitter subset. Classifier trained live.
- **Era 4**: Real Wikipedia / Gutenberg / CPython snippets. Real GPT-2 small outputs (local) + 1.5B unicorn sample. GPT-3 training estimates grounded to Patterson et al 2021 + Lambda Labs.
- **Era 5**: AI responses are **simulated**. Tool chips, fake URLs, recovery codes, session links all fabricated. Numeric claims (wages, worker counts, energy, water) are grounded to TIME / Ouyang 2022 / Verge 2023 / Patterson 2021 / Li 2023. Stage 2 energy figures are order-of-magnitude estimates, stated as such in About.

## Feedback form

- Google Form: `1FAIpQLSc6snNpjglUd0IzMxr1e6y2uq3vnUuLF6DmvopJJ5os5bPu0g`.
- Three fields: `entry.276926472` (section dropdown), `entry.1068859509` (report), `entry.153301494` (email).
- Section option strings in `Feedback.jsx` must match the form exactly (Google validates dropdowns).
- Use `fetch(..., { mode: 'no-cors' })` — we can't read the response but the row lands.
- When form changes: refetch `FB_PUBLIC_LOAD_DATA_` from the live viewform HTML, update `ENTRY` map + `SECTIONS` list.

## Key design decisions

- **Mount-all for state persistence**: every era component stays mounted; visibility toggled with CSS. Internal step components likewise rely on local state that should survive navigation (Era 4 Tag lifts state to `Generalized.jsx` explicitly because it re-mounts on step change).
- **Skip-ahead gate at ≥3**: any activity with ≥4 similar repetitions exposes a "Skip ahead →" once the user has completed 3. Applies to Label rounds, Predict snippets, RLHF rounds. Era 3 Place uses a smarter gate tied to `inferSigns()`.
- **Staged instructions** (callout boxes with orange border): used where two actions must happen in sequence — Era 3 Place (name axes → drag), Era 4 Predict (submit guess → click attention words), Era 2 Test (after predictions render → click words to add).
- **"Pay attention" vocabulary** in Era 4 for what highlighted words mean — used in Predict intro, Predict staged callout, and Tag intro.
- **Low-meaning words** in user-facing copy (Era 2 Retrain) instead of "stopwords". Internal const remains `STOPWORDS`.

## Open Backlog

- **Audit pass**: walk each era end-to-end on deployed site for copy inconsistencies, broken links, stale grading language. Re-check every numeric claim against its cited source.
- **Bundle-size optimization** (nice-to-have): ~670 KB gzipped first paint. Dominant chunks: UCI SMS corpus, GloVe vectors, Sentiment140, GPT-2 attention JSON. Fix via dynamic `import()` per era in `App.jsx`'s `EraPanels` or moving large JSONs to `public/` and `fetch()` on era-enter. Expected ~60% smaller first paint.
