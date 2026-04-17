// Stage 4 — "One model, many tasks"
//
// Preselected starters. Mix of real early-LLM outputs (Karpathy 2015
// char-RNN on Shakespeare + Wikipedia, Janelle Shane's costume char-RNN,
// fresh GPT-2 small samples generated locally) plus a modern-LLM Python
// sample for contrast.
//
// Samples chosen to be recognizable to American high schoolers: a
// little Python is fine; no niche Linux kernel / algebraic geometry.

export const STARTERS = [
  {
    id: "shakespeare",
    label: "Shakespeare",
    blurb: "char-RNN trained on the complete works of Shakespeare (Karpathy, 2015)",
    sourceUrl: "https://karpathy.github.io/2015/05/21/rnn-effectiveness/",
    prompt: "VIOLA:",
    samples: [
      `VIOLA:
Why, Salisbury must find his flesh and thought
That which I am not aps, not a man and in fire,
To show the reining of the raven and the wars
To grace my hand reproach within, and not a fair are hand,
That Caesar and my goodly father's world;
When I was heaven of presence and our fleets,
We spare with hours, but cut thy council I am great,
Murdered and by thy master's ready there
My power to give thee but so much as hell`,
    ],
  },
  {
    id: "wikipedia",
    label: "Wikipedia article",
    blurb: "char-RNN trained on Wikipedia (Karpathy, 2015)",
    sourceUrl: "https://karpathy.github.io/2015/05/21/rnn-effectiveness/",
    prompt: "Naturalism and",
    samples: [
      `Naturalism and decision for the majority of Arab countries' capitalide was grounded by the Irish language by [[John Clair]], [[An Imperial Japanese Revolt]], associated with Guangzham's sovereignty.`,
    ],
  },
  {
    id: "costumes",
    label: "Halloween costumes",
    blurb: "char-RNN trained on Halloween costume names (Janelle Shane, 2017)",
    sourceUrl:
      "https://www.aiweirdness.com/tiny-neural-net-halloween-costumes-are-the-best/",
    prompt: "Halloween costume ideas:",
    samples: [
      `Halloween costume ideas:
- Jamm the Hedgehog
- Princess Grandma Chicken
- Spider Fred
- Ruth Bader Pants
- Ghost of the Humbun`,
    ],
  },
  {
    id: "recipe",
    label: "Recipe",
    blurb: "GPT-2 small (OpenAI, 2019), generated locally",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "Recipe for chocolate chip cookies:\nIngredients:",
    mono: true,
    samples: [
      `Recipe for chocolate chip cookies:
Ingredients:
1 cup granulated sugar
¼ cup brown sugar, softened
1 cup dark brown sugar
1/2 cup milk
3/4 cup water
1 tsp vanilla extract, to taste
Directions:
In a mixing bowl, combine`,
    ],
  },
  {
    id: "movies",
    label: "Top-5 movies list",
    blurb: "GPT-2 small (OpenAI, 2019), generated locally",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "Top 5 movies of all time:\n1.",
    mono: true,
    samples: [
      `Top 5 movies of all time:
1. The Princess Diaries
2. The Princess Diaries
3. The Princess Diaries
4. The Princess Diaries
5. The Princess Diaries`,
    ],
  },
  {
    id: "fairytale",
    label: "Fairy tale",
    blurb: "GPT-2 small (OpenAI, 2019), generated locally",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "Once upon a time,",
    samples: [
      `Once upon a time, there was a little girl who lived with them all. She was beautiful; she was a beautiful girl. And she was all right with the whole world. And so she was raised by the rich and rich and rich, she was raised by the rich and rich, she was raised by the rich and rich, she was raised by the rich and rich, and she was raised by the`,
    ],
  },
  {
    id: "advice",
    label: "Advice column",
    blurb: "GPT-2 small (OpenAI, 2019), generated locally",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "Dear Abby, my neighbor plays loud music at 3am. What should I",
    samples: [
      `Dear Abby, my neighbor plays loud music at 3am. What should I do? She's playing a tune that's playing while I'm asleep, and she'll play it when I'm awake, and sometimes she's just playing until I wake up, but when I wake up she'll just play the melody when I'm asleep. I think that it's important`,
    ],
  },
  {
    id: "history",
    label: "History article",
    blurb: "GPT-2 small (OpenAI, 2019), generated locally",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "The Battle of Hastings was fought in 1066 between",
    samples: [
      `The Battle of Hastings was fought in 1066 between the English, Irish, French, and Scots, and in 1071 between the Germanic and Welsh Empires. This was not the first time a battle was fought in Wales and England between two different races.`,
    ],
  },
  {
    id: "python",
    label: "Python code (modern LLM, for comparison)",
    blurb: "modern LLM — same recipe, way more data and compute",
    sourceUrl: "https://huggingface.co/openai-community/gpt2",
    prompt: "def is_prime(n):",
    mono: true,
    samples: [
      `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True`,
    ],
  },
];
