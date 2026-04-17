// ELIZA rule data — ported from Joseph Weizenbaum's 1966 ELIZA via
// Norbert Landsteiner's JS implementation at https://www.masswerk.at/elizabot/
//
// Two tiers of rules:
//   TEACHING_IDS — small set students can read (simple DSL only)
//   EXTRA_IDS    — additional rules students can reveal with "show more"
//                  These use richer patterns we don't fully document.
// The chat engine uses ALL rules (RULES). MatchGame and BuildRule show
// the teaching subset by default.
//
// Pattern DSL (simple, used by teaching subset and student-written rules):
//   word           → matches the word anywhere
//   word1 OR word2 → matches if any appears
//   (a OR b)       → captures which one matched as {USERTEXT}
//   ...phrase... * → captures whatever follows * as {USERTEXT}
//   *              → catch-all (whole input becomes {USERTEXT})
//
// Extended DSL (used by some "more" rules):
//   * word *       → multiple wildcards, captured in order ({1}, {2}, ...)
//   @key           → expands to a synonym group ({1}, {2}, ... captured)
//
// Rule shape — either:
//   { id, pattern, responses, rank? }                              ← simple
//   { id, pattern: [p1, p2, ...], responses, rank? }              ← simple, multi-form
//   { id, key?, rank?, decomps: [{ pattern, responses, memory? }] } ← multi
// Decomp memory:true means the response is stored to be surfaced later
// when no other rule matches, instead of returning immediately.

// Pronoun swaps applied to captured text so echoes are grammatical.
export const PRONOUN_SWAPS = {
  am: "are",
  your: "my",
  me: "you",
  myself: "yourself",
  yourself: "myself",
  i: "you",
  you: "I",
  my: "your",
  "i'm": "you are",
};

// Pre-substitutions: applied to user input before matching, to normalize.
// Kept intentionally small. Anything that would change *which word* a teaching
// rule appears to match should go in the rule's pattern instead, so students
// see exactly what the rule recognizes.
export const PRES = [
  ["wont", "won't"],
  ["were", "was"],
  ["same", "alike"],
  ["identical", "alike"],
  ["equivalent", "alike"],
];

// Synonym groups for `@key` patterns.
export const SYNONYMS = {
  be: ["am", "is", "are", "was"],
  belief: ["feel", "think", "believe", "wish"],
  cannot: ["can't"],
  desire: ["want", "need"],
  everyone: ["everybody", "nobody", "noone"],
  family: ["mother", "mom", "father", "dad", "sister", "brother", "wife", "children", "child"],
  happy: ["elated", "glad", "better"],
  sad: ["unhappy", "depressed", "sick"],
};

// Opening line(s) shown when the conversation starts.
export const INITIALS = [
  "How do you do. Please tell me what's been bothering you.",
  "Hi. Is something troubling you?",
  "Hello. Please tell me what's on your mind.",
];

// ── Teaching subset (simple DSL) ─────────────────────────
// These are the rules MatchGame quizzes on and BuildRule references
// by default. They use the simple DSL students see.

const TEACHING_RULES = [
  {
    id: "family",
    pattern: "(mother OR father OR mom OR dad OR sister OR brother OR parent)",
    responses: [
      "Tell me more about your family.",
      "Who else in your family is like that?",
      "How do you feel about your {USERTEXT}?",
    ],
  },
  {
    id: "feeling",
    pattern: "(happy OR sad OR angry OR worried OR scared OR nervous OR excited)",
    responses: [
      "What makes you feel {USERTEXT}?",
      "How often do you feel {USERTEXT}?",
      "When was the last time you felt {USERTEXT}?",
    ],
  },
  {
    id: "i-feel",
    pattern: "i feel *",
    responses: [
      "Tell me more about feeling {USERTEXT}.",
      "Do you often feel {USERTEXT}?",
      "When do you usually feel {USERTEXT}?",
    ],
  },
  {
    id: "i-am",
    pattern: ["i am *", "i'm *"],
    responses: [
      "How long have you been {USERTEXT}?",
      "Do you enjoy being {USERTEXT}?",
      "Why do you say you are {USERTEXT}?",
    ],
  },
  {
    id: "i-want",
    pattern: "i want *",
    responses: [
      "What would it mean if you got {USERTEXT}?",
      "Why do you want {USERTEXT}?",
      "Suppose you got {USERTEXT} \u2014 then what?",
    ],
  },
  {
    id: "i-cant",
    pattern: ["i can't *", "i cant *", "i cannot *"],
    responses: [
      "What makes you think you can't {USERTEXT}?",
      "Have you tried to {USERTEXT}?",
      "What would happen if you could {USERTEXT}?",
    ],
  },
  {
    id: "i-think",
    pattern: "i think *",
    responses: [
      "Do you doubt {USERTEXT}?",
      "But you're not sure {USERTEXT}?",
      "Why do you think {USERTEXT}?",
    ],
  },
  {
    id: "i-like",
    pattern: "i like *",
    responses: [
      "What do you like most about {USERTEXT}?",
      "When did you start liking {USERTEXT}?",
      "Does anyone else you know like {USERTEXT}?",
    ],
  },
  {
    id: "remember",
    pattern: ["remember *", "recall *", "recollect *"],
    responses: [
      "Do you often think of {USERTEXT}?",
      "Why do you remember {USERTEXT} just now?",
      "What else do you remember?",
    ],
  },
  {
    id: "dream",
    pattern: "dream OR dreams OR dreamed OR dreamt",
    responses: [
      "What does that dream suggest to you?",
      "Do you dream often?",
      "Have you ever told anyone about this dream?",
    ],
  },
  {
    id: "friend",
    pattern: "friend OR friends",
    responses: [
      "Tell me more about your friends.",
      "Do your friends worry you?",
      "Why do you bring up your friends?",
    ],
  },
  {
    id: "you-are",
    pattern: ["you are *", "you're *"],
    responses: [
      "Why do you think I am {USERTEXT}?",
      "Does it please you to believe I am {USERTEXT}?",
    ],
  },
  {
    id: "why-dont-you",
    pattern: ["why don't you *", "why dont you *"],
    responses: [
      "Do you really think I don't {USERTEXT}?",
      "Perhaps eventually I will {USERTEXT}.",
    ],
  },
  {
    id: "because",
    pattern: "because *",
    responses: [
      "Is that the real reason?",
      "What other reasons come to mind?",
    ],
  },
  {
    id: "always-never",
    pattern: "always OR never",
    responses: [
      "Can you think of a specific example?",
      "Really, always?",
      "When?",
    ],
  },
  {
    id: "maybe",
    pattern: "maybe OR perhaps",
    responses: [
      "You don't seem quite certain.",
      "Why the uncertain tone?",
    ],
  },
  {
    id: "problem",
    pattern: "problem OR problems OR trouble OR issue",
    responses: [
      "Tell me more about this problem.",
      "How does that affect you?",
      "What do you think is causing it?",
    ],
  },
  {
    id: "hurt",
    pattern: "hurt OR hurts OR hurting OR pain OR sore OR ache",
    responses: [
      "I'm sorry to hear that. Can you say more?",
      "How long has this been going on?",
      "Where do you feel it most?",
    ],
  },
  {
    id: "sorry",
    pattern: "sorry",
    responses: [
      "There's no need to apologize.",
      "Apologies aren't necessary here.",
    ],
  },
  {
    id: "hello",
    pattern: "hello OR hi OR hey",
    responses: [
      "Hello. Please tell me what's on your mind.",
      "Hi there. How are you feeling today?",
    ],
  },
  {
    id: "yes",
    pattern: "yes OR yeah OR yep OR yup",
    responses: [
      "You seem quite sure.",
      "I see. Go on.",
    ],
  },
  {
    id: "no",
    pattern: "no OR nope",
    responses: [
      "Why not?",
      "Are you saying no just to be negative?",
    ],
  },
  {
    id: "computer",
    pattern: "computer OR computers OR machine OR machines OR bot",
    rank: 50,
    responses: [
      "Do computers worry you?",
      "Why do you mention computers?",
      "What do you think about machines?",
      "You don't think I am a computer program, do you?",
    ],
  },
];

// How many teaching rules to show by default in MatchGame / BuildRule.
export const TEACHING_SAMPLE_SIZE = 10;

export const TEACHING_IDS = TEACHING_RULES.map((r) => r.id);

// ── Extra rules (richer DSL, revealed on demand) ─────────
// Multi-decomp Masswerk-style rules. We don't expect students to
// fully parse these; they're shown as "the kind of thing real ELIZA
// has" for the curious.

const EXTRA_RULES = [
  {
    id: "remember",
    key: "remember",
    rank: 5,
    decomps: [
      { pattern: "* i remember *", responses: [
        "Do you often think of {2}?",
        "Why do you remember {2} just now?",
        "What in the present situation reminds you of {2}?",
        "What else do you remember?",
      ]},
      { pattern: "* do you remember *", responses: [
        "Did you think I would forget {2}?",
        "Why do you think I should recall {2} now?",
        "What about {2}?",
        "You mentioned {2}?",
      ]},
    ],
  },
  {
    id: "if",
    key: "if",
    rank: 3,
    decomps: [
      { pattern: "* if *", responses: [
        "Do you think it's likely that {2}?",
        "Do you wish that {2}?",
        "What would you do if {2}?",
        "What does this speculation lead to?",
      ]},
    ],
  },
  {
    id: "dream",
    key: "dream",
    rank: 3,
    decomps: [
      { pattern: "*", responses: [
        "What does that dream suggest to you?",
        "Do you dream often?",
        "What persons appear in your dreams?",
        "Do you believe that dreams have something to do with your problem?",
      ]},
    ],
  },
  {
    id: "i",
    key: "i",
    rank: 0,
    decomps: [
      { pattern: "* i @desire *", responses: [
        "What would it mean to you if you got {3}?",
        "Why do you want {3}?",
        "Suppose you got {3} soon.",
        "What if you never got {3}?",
      ]},
      { pattern: "* i am * @sad *", responses: [
        "I am sorry to hear that you are {3}.",
        "Do you think coming here will help you not to be {3}?",
        "Can you explain what made you {3}?",
      ]},
      { pattern: "* i am * @happy *", responses: [
        "How have I helped you to be {3}?",
        "What makes you {3} just now?",
        "Can you explain why you are suddenly {3}?",
      ]},
      { pattern: "* i @belief i *", responses: [
        "Do you really think so?",
        "But you are not sure you {3}.",
        "Do you really doubt you {3}?",
      ]},
      { pattern: "* i am *", responses: [
        "Is it because you are {2} that you came to me?",
        "How long have you been {2}?",
        "Do you believe it is normal to be {2}?",
        "Do you enjoy being {2}?",
      ]},
      { pattern: "* i @cannot *", responses: [
        "How do you know that you can't {3}?",
        "Have you tried?",
        "Perhaps you could {3} now.",
        "What if you could {3}?",
      ]},
      { pattern: "* i don't *", responses: [
        "Don't you really {2}?",
        "Why don't you {2}?",
        "Do you wish to be able to {2}?",
      ]},
      { pattern: "* i feel *", responses: [
        "Tell me more about such feelings.",
        "Do you often feel {2}?",
        "Do you enjoy feeling {2}?",
      ]},
      { pattern: "* i * you *", responses: [
        "Perhaps in your fantasies we {2} each other.",
        "Do you wish to {2} me?",
        "You seem to need to {2} me.",
        "Do you {2} anyone else?",
      ]},
      { pattern: "*", responses: [
        "You say {1}?",
        "Can you elaborate on that?",
        "Do you say {1} for some special reason?",
        "That's quite interesting.",
      ]},
    ],
  },
  {
    id: "you",
    key: "you",
    rank: 0,
    decomps: [
      { pattern: "* you are *", responses: [
        "What makes you think I am {2}?",
        "Does it please you to believe I am {2}?",
        "Do you sometimes wish you were {2}?",
        "Perhaps you would like to be {2}.",
      ]},
      { pattern: "* you * me *", responses: [
        "Why do you think I {2} you?",
        "You like to think I {2} you \u2014 don't you?",
        "Really, I {2} you?",
        "Do you wish to believe I {2} you?",
      ]},
      { pattern: "* you *", responses: [
        "We were discussing you \u2014 not me.",
        "You're not really talking about me \u2014 are you?",
        "What are your feelings now?",
      ]},
    ],
  },
  {
    id: "my",
    key: "my",
    rank: 2,
    decomps: [
      { pattern: "* my *", memory: true, responses: [
        "Earlier you said your {2}.",
        "But your {2}.",
        "Does that have anything to do with the fact that your {2}?",
        "Let's discuss further why your {2}.",
      ]},
      { pattern: "* my * @family *", responses: [
        "Tell me more about your family.",
        "Who else in your family {4}?",
        "Your {3}?",
        "What else comes to your mind when you think of your {3}?",
      ]},
      { pattern: "* my *", responses: [
        "Your {2}?",
        "Why do you say your {2}?",
        "Does that suggest anything else which belongs to you?",
        "Is it important to you that your {2}?",
      ]},
    ],
  },
  {
    id: "your",
    key: "your",
    rank: 0,
    decomps: [
      { pattern: "* your *", responses: [
        "Why are you concerned over my {2}?",
        "What about your own {2}?",
        "Are you worried about someone else's {2}?",
        "What makes you think of my {2}?",
      ]},
    ],
  },
  {
    id: "what",
    key: "what",
    rank: 0,
    decomps: [
      { pattern: "*", responses: [
        "Why do you ask?",
        "Does that question interest you?",
        "What is it you really want to know?",
        "What answer would please you most?",
        "What do you think?",
        "What comes to mind when you ask that?",
      ]},
    ],
  },
  {
    id: "why",
    key: "why",
    rank: 0,
    decomps: [
      { pattern: "* why don't you *", responses: [
        "Do you believe I don't {2}?",
        "Perhaps I will {2} in good time.",
        "Should you {2} yourself?",
        "You want me to {2}?",
      ]},
      { pattern: "* why can't i *", responses: [
        "Do you think you should be able to {2}?",
        "Do you want to be able to {2}?",
        "Have you any idea why you can't {2}?",
      ]},
      { pattern: "*", responses: ["goto what"] },
    ],
  },
  {
    id: "who",  key: "who",  decomps: [{ pattern: "*", responses: ["goto what"] }] },
  { id: "when", key: "when", decomps: [{ pattern: "*", responses: ["goto what"] }] },
  { id: "where", key: "where", decomps: [{ pattern: "*", responses: ["goto what"] }] },
  { id: "how", key: "how", decomps: [{ pattern: "*", responses: ["goto what"] }] },
  {
    id: "because",
    key: "because",
    decomps: [
      { pattern: "*", responses: [
        "Is that the real reason?",
        "Don't any other reasons come to mind?",
        "What other reasons might there be?",
      ]},
    ],
  },
  {
    id: "perhaps",
    key: "perhaps",
    decomps: [
      { pattern: "*", responses: [
        "You don't seem quite certain.",
        "Why the uncertain tone?",
        "You aren't sure?",
        "Don't you know?",
      ]},
    ],
  },
  {
    id: "always",
    key: "always",
    rank: 1,
    decomps: [
      { pattern: "*", responses: [
        "Can you think of a specific example?",
        "When?",
        "What incident are you thinking of?",
        "Really, always?",
      ]},
    ],
  },
  {
    id: "alike",
    key: "alike",
    rank: 10,
    decomps: [
      { pattern: "*", responses: [
        "In what way?",
        "What resemblance do you see?",
        "What does that similarity suggest to you?",
        "What is the connection, do you suppose?",
      ]},
    ],
  },
  {
    id: "everyone",
    key: "everyone",
    rank: 2,
    decomps: [
      { pattern: "* @everyone *", responses: [
        "Really, {2}?",
        "Surely not {2}.",
        "Can you think of anyone in particular?",
        "Who, for example?",
        "Are you thinking of a very special person?",
      ]},
    ],
  },
  {
    id: "xnone",
    key: "xnone",
    decomps: [
      { pattern: "*", responses: [
        "I'm not sure I understand you fully.",
        "Please go on.",
        "What does that suggest to you?",
        "Do you feel strongly about discussing such things?",
        "That is interesting. Please continue.",
        "Tell me more about that.",
        "Does talking about this bother you?",
      ]},
    ],
  },
];

export const EXTRA_IDS = EXTRA_RULES.map((r) => r.id);

// Full ruleset used by the chat engine. Order doesn't matter for matching
// (engine sorts by rank), but we keep teaching rules first for readability.
export const RULES = [...TEACHING_RULES, ...EXTRA_RULES];
