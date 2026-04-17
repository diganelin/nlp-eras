// Deterministic fake @handles + display names + avatar colors for tweets.
// Sentiment140 was scraped in 2009, so the handles match that vibe.

const HANDLES = [
  { handle: "skatergrrl23", name: "Jess" },
  { handle: "_morgan_",     name: "Morgan" },
  { handle: "daveyd",       name: "Dave" },
  { handle: "lilmissmia",   name: "Mia" },
  { handle: "tyleroxo",     name: "Tyler" },
  { handle: "brookelynn",   name: "Brooke" },
  { handle: "nico_p",       name: "Nico" },
  { handle: "hannahbnana",  name: "Hannah" },
  { handle: "mattwhatever", name: "Matt" },
  { handle: "sammy_k",      name: "Sam" },
  { handle: "rileyy",       name: "Riley" },
  { handle: "ashleighhx",   name: "Ashleigh" },
  { handle: "ninjakid07",   name: "Noah" },
  { handle: "zoeyinblue",   name: "Zoey" },
  { handle: "drewsef",      name: "Drew" },
  { handle: "iamericaaa",   name: "Erica" },
  { handle: "kennyboi",     name: "Ken" },
  { handle: "rubyrocks",    name: "Ruby" },
  { handle: "steveo_",      name: "Steve" },
  { handle: "xoxo_taylor",  name: "Taylor" },
  { handle: "madidee",      name: "Maddie" },
  { handle: "joshbirdd",    name: "Josh" },
  { handle: "emmmma",       name: "Emma" },
  { handle: "kaitlyn22",    name: "Kaitlyn" },
  { handle: "alexwho",      name: "Alex" },
  { handle: "lolitsjordan", name: "Jordan" },
  { handle: "chloe_bee",    name: "Chloe" },
  { handle: "benlolz",      name: "Ben" },
  { handle: "oliviaxo",     name: "Olivia" },
  { handle: "dannyboy_",    name: "Danny" },
];

const AVATAR_COLORS = [
  "#f5a06b", "#7fb3d5", "#c39bd3", "#f7b2c2", "#82c8a0",
  "#e59866", "#85c1e9", "#b39ddb", "#f48fb1", "#a5d6a7",
];

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function presentation(text) {
  const h = hash(text);
  const u = HANDLES[h % HANDLES.length];
  const color = AVATAR_COLORS[h % AVATAR_COLORS.length];
  return { handle: u.handle, name: u.name, color, initial: u.name[0] };
}
