// Stage 1 — "You're the model": fill-in-the-blank snippets pulled from real
// sources (Wikipedia, public-domain fiction, CPython stdlib). Each snippet
// cuts off at one word; the student guesses; the full continuation is then
// revealed along with the source.

export const SNIPPETS = [
  {
    id: "wiki-cat",
    source: "Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/Cat",
    before: "The cat (Felis catus), also called domestic cat and house cat, is a small carnivorous",
    answer: "mammal",
    continuation:
      "mammal. It is an obligate carnivore, requiring a predominantly meat-based diet.",
  },
  {
    id: "wiki-apollo",
    source: "Wikipedia — Apollo 11",
    sourceUrl: "https://en.wikipedia.org/wiki/Apollo_11",
    before:
      "Apollo 11 was the American spaceflight that first landed humans on the",
    answer: "Moon",
    continuation:
      "Moon, and the fifth crewed mission of NASA's Apollo program.",
  },
  {
    id: "novel-austen",
    source: "Jane Austen, Pride and Prejudice (1813)",
    sourceUrl: "https://www.gutenberg.org/files/1342/1342-h/1342-h.htm",
    before:
      "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a",
    answer: "wife",
    continuation: "wife.",
  },
  {
    id: "novel-sherlock",
    source: "A. Conan Doyle, \"A Scandal in Bohemia\" (1891)",
    sourceUrl: "https://www.gutenberg.org/files/1661/1661-h/1661-h.htm",
    before: "To Sherlock Holmes she is always the",
    answer: "woman",
    continuation:
      "woman. I have seldom heard him mention her under any other name.",
  },
  {
    id: "novel-huck",
    source: "Mark Twain, Huckleberry Finn (1884)",
    sourceUrl: "https://www.gutenberg.org/files/76/76-h/76-h.htm",
    before:
      "You don't know about me without you have read a book by the name of The Adventures of Tom",
    answer: "Sawyer",
    continuation: "Sawyer; but that ain't no matter.",
  },
  {
    id: "wiki-cookie",
    source: "Wikipedia — Chocolate chip cookie",
    sourceUrl: "https://en.wikipedia.org/wiki/Chocolate_chip_cookie",
    before:
      "A chocolate chip cookie is a drop cookie that contains pieces of chocolate mixed into the dough before",
    answer: "baking",
    continuation:
      "baking. Texture and appearance vary with ingredients and preparation, ranging from moist and chewy to crispy.",
  },
  {
    id: "poem-dickinson",
    source: "Emily Dickinson, c. 1861",
    sourceUrl: "https://www.gutenberg.org/ebooks/12242",
    before: "Hope is the thing with",
    answer: "feathers",
    continuation:
      "feathers /\nThat perches in the soul, /\nAnd sings the tune without the words, /\nAnd never stops at all.",
  },
  {
    id: "code-median",
    source: "CPython stdlib (statistics.py)",
    sourceUrl: "https://github.com/python/cpython/blob/main/Lib/statistics.py",
    before:
      "def median_low(data):\n    data = sorted(data)\n    n = len(data)\n    if n == 0:\n        raise StatisticsError('no median for empty",
    answer: "data",
    continuation:
      "data')\n    if n % 2 == 1:\n        return data[n // 2]\n    else:\n        return data[n // 2 - 1]",
    mono: true,
  },
];
