// Stage 3 — "One model, many tasks"
//
// Preselected starters. The Shakespeare, fake-Wikipedia, fake-C, and
// fake-algebraic-geometry samples are verbatim from Andrej Karpathy's 2015
// blog post "The Unreasonable Effectiveness of Recurrent Neural Networks"
// (https://karpathy.github.io/2015/05/21/rnn-effectiveness/) — real
// outputs from his char-level RNN trained on Shakespeare, Wikipedia,
// the Linux kernel source, and the Stacks Project. Locally plausible,
// globally nonsense — which is exactly what students should notice.
//
// The Python sample is representative of modern LLM completion (for
// contrast — "the same recipe, scaled up").

export const STARTERS = [
  {
    id: "shakespeare",
    label: "Shakespeare",
    blurb: "char-RNN trained on the complete works of Shakespeare (2015)",
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
    blurb: "char-RNN trained on Wikipedia (2015)",
    prompt: "Naturalism and",
    samples: [
      `Naturalism and decision for the majority of Arab countries' capitalide was grounded by the Irish language by [[John Clair]], [[An Imperial Japanese Revolt]], associated with Guangzham's sovereignty.`,
    ],
  },
  {
    id: "c-code",
    label: "Linux kernel C",
    blurb: "char-RNN trained on the Linux kernel source (2015)",
    prompt: "/*",
    mono: true,
    samples: [
      `/*
 * Increment the size file of the new incorrect UI_FILTER group information
 * of the size generatively.
 */
static int indicate_policy(void)
{
  int error;
  if (fd == MARN_EPT) {`,
    ],
  },
  {
    id: "math",
    label: "Algebraic geometry",
    blurb: "char-RNN trained on the Stacks Project LaTeX (2015)",
    prompt: "We may assume that",
    samples: [
      `We may assume that $\\mathcal{I}$ is an abelian sheaf on $\\mathcal{C}$. \\item Given a morphism $\\Delta : \\mathcal{F} \\to \\mathcal{I}$ is an injective and let $\\mathfrak q$ be an abelian sheaf on $X$.`,
    ],
  },
  {
    id: "python",
    label: "Python code (modern LLM, for comparison)",
    blurb: "same recipe, way more data and compute",
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
