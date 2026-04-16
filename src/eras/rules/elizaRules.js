// Rules ELIZA checks top-to-bottom.
// pattern uses our mini-language:
//   word         → matches the word anywhere
//   word1 OR word2 → matches if any of them appears
//   (a OR b)     → captures which one matched as {1}
//   ...phrase... *  → captures whatever follows * as {1}
//   *            → catch-all (whole input becomes {1})
//
// Each id is just a stable label so we can log which rule fired.

export const PRONOUN_SWAPS = {
  i:    "you",
  me:   "you",
  my:   "your",
  am:   "are",
  mine: "yours",
  myself: "yourself",
  you:  "I",
  your: "my",
  yours: "mine",
  are:  "am",
};

export const RULES = [
  {
    id: "family",
    pattern: "(mother OR father OR mom OR dad OR sister OR brother OR parent)",
    responses: [
      "Tell me more about your family.",
      "Who else in your family is like that?",
      "How do you feel about your {1}?",
    ],
  },
  {
    id: "i-am",
    pattern: "i am *",
    responses: [
      "How long have you been {1}?",
      "Do you enjoy being {1}?",
      "Why do you say you are {1}?",
    ],
  },
  {
    id: "i-feel",
    pattern: "i feel *",
    responses: [
      "Tell me more about feeling {1}.",
      "Do you often feel {1}?",
      "When do you usually feel {1}?",
    ],
  },
  {
    id: "i-want",
    pattern: "i want *",
    responses: [
      "What would it mean if you got {1}?",
      "Why do you want {1}?",
      "Suppose you got {1} \u2014 then what?",
    ],
  },
  {
    id: "i-cant",
    pattern: "i can't *",
    responses: [
      "What makes you think you can't {1}?",
      "Have you tried to {1}?",
      "What would happen if you could {1}?",
    ],
  },
  {
    id: "i-think",
    pattern: "i think *",
    responses: [
      "Do you doubt {1}?",
      "But you're not sure {1}?",
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
    id: "sorry",
    pattern: "sorry",
    responses: [
      "There's no need to apologize.",
      "Apologies aren't necessary here.",
    ],
  },
  {
    id: "dream",
    pattern: "(dream OR dreamed OR dreams)",
    responses: [
      "What does that {1} suggest to you?",
      "Do you dream often?",
      "Have you ever told anyone about this dream?",
    ],
  },
  {
    id: "remember",
    pattern: "remember *",
    responses: [
      "Do you often think of {1}?",
      "Why do you remember {1} just now?",
      "What else do you remember?",
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
    id: "yes",
    pattern: "yes",
    responses: [
      "You seem quite sure.",
      "I see. Go on.",
    ],
  },
  {
    id: "no",
    pattern: "no",
    responses: [
      "Why not?",
      "Are you saying no just to be negative?",
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
    id: "you-are",
    pattern: "you are *",
    responses: [
      "Why do you think I am {1}?",
      "Does it please you to believe I am {1}?",
    ],
  },
  {
    id: "why-dont-you",
    pattern: "why don't you *",
    responses: [
      "Do you really think I don't {1}?",
      "Perhaps eventually I will {1}.",
    ],
  },
  {
    id: "friend",
    pattern: "friend OR friends",
    responses: [
      "Tell me more about your friends.",
      "Do your friends worry you?",
    ],
  },
  {
    id: "like",
    pattern: "i like *",
    responses: [
      "What do you like most about {1}?",
      "When did you start liking {1}?",
      "Does anyone else you know like {1}?",
    ],
  },
  {
    id: "worried",
    pattern: "(happy OR sad OR angry OR worried OR scared OR nervous OR excited)",
    responses: [
      "What makes you feel {1}?",
      "How often do you feel {1}?",
      "When was the last time you felt {1}?",
    ],
  },
  {
    id: "computer",
    pattern: "computer OR machine OR bot",
    responses: [
      "Do computers worry you?",
      "What do you think about machines?",
    ],
  },
  {
    id: "fallback",
    pattern: "*",
    responses: [
      "Please tell me more.",
      "Can you elaborate on that?",
      "Why do you say that?",
      "I see. Go on.",
      "That's interesting. What makes you say that?",
      "How does that make you feel?",
      "What does that suggest to you?",
      "Tell me more.",
    ],
  },
];
