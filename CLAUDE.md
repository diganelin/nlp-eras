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

**Plain language over jargon.** ML terms students already know are fine (training set, accuracy, model). NLP-specific terms should be introduced through the activity, or replaced with everyday words ("score" not "weight", "bag of words" introduced visually).

**Stay at the word level; avoid model-architecture internals.** Students don't need to know how RNNs/LSTMs/transformers work mechanically to get the big ideas. Frame everything in terms of the *task* (predict next word, classify text, place words in space) and *what the model learned*. Architecture diagrams, hidden states, attention heads, etc. are out of scope.

## Storyline Structure

Six "Big Idea" eras as sidebar tabs:

| # | Era | ~Year | Key Concept |
|---|-----|-------|-------------|
| 0 | Rules & Dictionaries | pre-2000 | ELIZA, pattern-matching rules |
| 1 | ML with Language | ~2000 | Word counting, spam classification |
| 2 | Numbers & Meaning | ~2013 | Word2Vec, tweet sentiment |
| 3 | Generalized Learning | ~2020 | Next-word prediction as universal task (GPT-era) |
| 4 | Scale & Transformers | ~2023 | Attention, transformer scaling, emergent behavior |
| 5 | Training Right | ~2022+ | RLHF, code RL, agents |

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

### Era 1 — ML with Language (spam classification)

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
- The transition animation between 1 and 2 is visual-only; no real training. Compute-cost numbers are placeholder and can be tuned.
- No discussion of RNN/LSTM/transformer architecture — stays at the "what task, what did the model learn from the training data" level.
