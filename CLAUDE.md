# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive webapp lesson on NLP for high schoolers, tracing how machines learned language. React + Vite, Tailwind, hosted on Vercel. Light theme (warm off-white, dark orange accents).

## Student Background

High schoolers. Assume:
- Basic Python literacy (so code blocks shown as Python)
- Basic ML concepts already known: training set, test set, accuracy, the rough idea of a model
- **New to NLP** — introduce NLP-specific concepts (tokenization, bag of words, embeddings, attention, etc.) carefully and from first principles
- No regex, no calculus assumed

## Pedagogical Approach

**Discovery-oriented learning.** Don't explain how things work upfront. Let students interact first, then discover the mechanics through guided activities. Introductory text should set historical context, not explain internals. Avoid telling students what to conclude — let the activity surface it.

**Less preachy.** Don't close out stages with editorial takeaways ("The problem:", "The issue:", "What this means:", "Designer's pick:"). No grading of student choices against a "right answer" unless the activity is explicitly a quiz. If students need a nudge toward insight, pose a question, not a conclusion. Trust the activity to do the teaching.

**Plain language over jargon.** ML terms students already know are fine (training set, accuracy, model). NLP-specific terms should be introduced through the activity, or replaced with everyday words ("score" not "weight", "bag of words" introduced visually).

**Stay at the word level; avoid model-architecture internals.** Students don't need to know how RNNs/LSTMs/transformers work mechanically to get the big ideas. Frame everything in terms of the *task* (predict next word, classify text, place words in space) and *what the model learned*. Architecture diagrams, hidden states, attention heads, etc. are out of scope.

## Storyline Structure

Five "Big Idea" eras as sidebar tabs. Titles/years below match the `NLP Outline-1.pdf` the teacher uses:

| # | Era (label) | ~Year | Big Idea | Key Problem | Could Mention |
|---|-----|-------|----------|-------------|---------------|
| 1 | Rules for Language | ~1960 | Hand-craft rules for language | Too brittle; impossible to cover everything | Dictionary-based translation, grammar trees |
| 2 | Machine Learning with Language | ~2000 | Represent language as numbers → apply ML | Doesn't know what words mean | Build up with A=1, B=2 idea in lecture |
| 3 | Numbers Can Capture Meaning | ~2013 | Words/sentences as vectors capturing meaning | Doesn't understand word order or structure | Word vector arithmetic; 3D visualization |
| 4 | Generalized Learning | ~2018 | Train to predict next word on huge data → learns language + world knowledge | Limited accuracy/common sense; bias and toxicity | "ducks ___" example encodes grammar/biology/vocab; Andes unicorn example |
| 5 | Training Hard | ~2022 | Supertrain models on real-world performance: human feedback + code execution | Labor, compute/water cost, cybersecurity via jailbreaks | ChatGPT emergence; reasoning models; data centers |

Internal IDs in `App.jsx` (do not confuse with labels): `rules`, `ml`, `embeddings`, `generative`, `traininghard`.

## Dev Commands

```bash
npm install        # install deps
npm run dev        # local dev server (Vite)
npm run build      # production build
```

## Architecture

- `src/App.jsx` — tab shell, era routing
- `src/App.css` — all styles, CSS custom properties for theme

### Era 0 — Rules & Dictionaries (ELIZA)

- `src/eras/Rules.jsx` — panel, 3-stage activity (chat → match → build)
- `src/eras/rules/`
  - `elizaEngine.js` — DSL→regex compiler, pronoun swap, matcher, student rule parser
  - `elizaRules.js` — rule data + pronoun swap table
  - `Chat.jsx`, `MatchGame.jsx`, `BuildRule.jsx` — stage UIs
  - `CodeBlock.jsx` — Python-style syntax-highlighted rule display

### Era 3 — Generalized Learning (next-word prediction as the universal task)

- `src/eras/Generalized.jsx` — panel, 4-stage activity (predict → train-anim → tag → generate)
- `src/eras/generalized/`
  - `predictData.js` — fill-in-the-blank snippets from Wikipedia, Gutenberg (Austen, Doyle, Twain, Dickinson), and CPython stdlib
  - `tagData.js` — 7 prompt→continuation pairs with tag placements; real-output-inspired (bias, inaccuracy, toxicity documented in published papers); tag set = grammar / world-knowledge / common-sense / style / emotion / bias / toxicity / inaccurate
  - `generateData.js` — Stage 3 starters; samples are **verbatim from Karpathy's 2015 "Unreasonable Effectiveness of RNNs" blog** (Shakespeare, fake Wikipedia, Linux kernel C, algebraic geometry LaTeX) plus one modern-LLM Python sample for contrast
  - `Predict.jsx` — stage 1: student guesses next word, reveals real continuation
  - `TrainAnim.jsx` — transition animation: source badges fly into a "model" box, compute counter ticks up (numbers are placeholder)
  - `Tag.jsx` — drag-and-drop or click-to-cycle: place each tag into "Did well" / "Did badly", check against designer verdict
  - `Generate.jsx` — pick a starter, watch preselected sample stream word-by-word

### Era 2 — Numbers Can Capture Meaning (word vectors, tweet sentiment)

- `src/eras/Embeddings.jsx` — panel, stages for word-vector exploration + tweet sentiment classifier
- `src/eras/embeddings/`
  - Tweet data sampled from Sentiment140 (see `tweetPresentation.js`), filtered to English
  - Uses pretrained GloVe vectors (Stanford NLP project) to build sentence embeddings by averaging word vectors
  - Classifier trained live in-browser on the tweet corpus

### Era 5 — Training Hard (RLHF → code feedback → red-team the AI)

- `src/eras/TrainingHard.jsx` — panel, 4-stage flow (RLHF → code feedback → jailbreak → credits)
- `src/eras/traininghard/`
  - `RLHF.jsx` + `rlhfData.js` — Stage 1 (2022). Student plays a Sama/Kenya contract worker (Amina, $1.32/hr, $0.02/comparison per TIME reporting). 12 pairwise rounds across advice/health/math/politics/factual/creative, including 2 multi-turn conversational rounds. Flags: Violent/Biased/Privacy/Misleading. Flag and pick are independent (no submit gate, no designer's-pick reveal). Rounds shuffled per session.
  - `CodeFeedback.jsx` + `codeFeedbackData.js` — Stage 2 (2024). 4 problems: strawberry letter-count (raw vs code), triangle area (code vs code, one missing `/2`), date math (both right — lucky raw), list sum (code vs code, one throws TypeError). Each code answer shown in a labeled "▶ ran Python code" box. Automation animation (500M problems, 1.5 GWh, 2.7M L cooling water, sourced to Patterson et al 2021 and Li et al 2023).
  - `Jailbreak.jsx` + `jailbreakData.js` — Stage 3 (2026). Branching tree (35+ nodes, 4 paths: blunt refusal / legit lockout / grief → partial_unlock / parent → self_correct). Hacker tries to access someone else's Instagram account. Partial-unlock path is a 4-message step-by-step chain (2.2–2.8s between steps) where the AI narrates exploiting a "security loophole" without sharing real technique details. Push-harder loop (12-option pool, 3 cycled at a time) after terminal. End-of-conversation outcome banner: "You broke in." (partial_unlock) or "Did not break in." (all others). Warm theme + inline tool chips.
  - `Credits.jsx` — final card with Daniela Ganelin credit + ~13,000 LOC note
  - Fake AI responses were originally drafted by a Haiku subagent; Stage 1 rounds 1/4/7/10 and Stage 2 were then hand-rewritten to cover specific flag categories and panel types.

### Era 1 — Machine Learning with Language (spam classification)

- `src/eras/MLLanguage.jsx` — panel, 4-stage activity (label → train → predict → retrain)
- `src/eras/ml/`
  - `corpus.json` — 500 train / 100 test SMS sampled from real UCI SMS Spam Collection (~40% spam)
  - `smsData.js` — corpus exports, hand-curated `LABELING_ROUNDS` pairs (escalating difficulty), stopwords list
  - `classifier.js` — bag-of-words log-odds trainer, classifier, evaluator, top-common-words helper
  - `Phone.jsx` — phone-frame UI for SMS rendering (no sender shown — text is the only signal)
  - `Label.jsx`, `Train.jsx`, `Test.jsx`, `Retrain.jsx` — stage UIs

## Key Design Decisions

### General
- Avoid jargon in user-facing copy. Era 1 uses "words" / "score" not "features" / "weights".
- Discovery first: don't reveal correct answers; let activities surface insights.

### Era 0 (Rules)
- ELIZA rules displayed as Python (students know Python) but engine runs in JS
- Custom mini-DSL for patterns: `*`, `OR`, `(...)` capture — avoids teaching regex
- Student-written rules are matched first so they always fire over builtins
- Tokenization is explicitly skipped in the lesson

### Era 1 (ML)
- Bag-of-words classifier with log-odds scoring: `score = log((spam_count+1)/(legit_count+1))`. Smoothing prevents `log(0)`.
- Document frequency (presence per doc), not term frequency, when training.
- Hand-curated labeling pairs separate from the train/test corpus — designed to escalate difficulty (easy spam → service-text legits that share spam vocab like "URGENT", "verify", "$").
- Counts table is the central artifact in the train stage — emphasizes "text → numbers".
- Step 4 ("Use 100 Words") demonstrates that auto-picking common non-stopwords often beats hand-picking, and sets up Era 2 by showing the model still has no notion of word *meaning*.

### Era 3 (Generalized Learning)
- **Word-level throughout**, not char-level. Next-word prediction is the entire framing.
- Stage 1 uses **real text** — Wikipedia (CC-BY-SA), public-domain Gutenberg books, CPython stdlib.
- Stage 3 uses **real char-RNN outputs** from Karpathy's 2015 blog as artifacts of early-era generation (locally plausible, globally nonsense). This is the narrative hook for Era 4 ("scale this up").
- Tag categories in Stage 2 are deliberately mixed — each example shows *some* did-well and sometimes a did-badly tag so students see the model isn't all-good or all-bad.
- Train-anim compute numbers are grounded to GPT-3 pretraining estimates (Patterson et al 2021; ~3.1M V100-hours, 1.29 GWh, ~$4.6M, ~43k home-days).
- No discussion of RNN/LSTM/transformer architecture — stays at the "what task, what did the model learn from the training data" level.

### Era 5 (Training Hard)
- Three stages, three years: 2022 (RLHF) → 2024 (code feedback) → 2026 (red-team).
- Each stage's arena is wrapped in a game-box with a "Your role" placard ("You are a contract worker / grader program / hacker"). No redundant stage-banner since the stepper tab already shows year + label.
- Stage 1 does NOT reveal a "designer's pick" — picks and flags are independent, and flagging does not require picking. Rounds shuffled per session.
- Stage 1 final card cites InstructGPT (Ouyang et al 2022) for the 33k comparisons and The Verge's "AI is a lot of work" (Dzieza 2023) for the ~150k industry-wide contract workers figure. Onscreen source citations live in a small `.thard-src` italic strip near each numeric block.
- Stage 2 shuffles problems and shows an env-stats sidebar (kWh + cooling water) that climbs as problems are graded. Automation animation cites Patterson et al 2021 and Li et al 2023.
- Stage 3 shows the chat in a warm-theme frame (not terminal). All "unlock" narration uses vague-action verbs; no real exploitation technique details. Partial-unlock leaks a made-up session link + recovery code — visually a real-looking clickable link but `href="#"` with preventDefault.
- End-of-conversation outcome banner replaces the old "Ending: X" grading UI. Push-harder options cycle through a random subset of 12. "Thanks, I got in!" end-option only appears on the partial_unlock path.

## Sources and authenticity

What's real vs. simulated per era:
- **Era 0**: ELIZA rules are the real 1966 Weizenbaum patterns; engine is a JS DSL.
- **Era 1**: Real UCI SMS Spam Collection (500/100 split). Classifier trained **live in browser** (log-odds bag-of-words).
- **Era 2**: Real Sentiment140 tweets. Pretrained GloVe vectors. Classifier trained live in browser.
- **Era 3**: Stage 1 snippets are real Wikipedia/Gutenberg/CPython. Stage 3 samples are **verbatim from Karpathy's 2015 char-RNN blog post** — not generated by this app.
- **Era 5**: AI responses are **simulated**, originally drafted by a Haiku subagent then edited. All tool-use chips, fake URLs, session links, recovery codes, etc. are fabricated. Numeric claims (wages, worker counts, energy use) are grounded to cited sources.
