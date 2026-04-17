"""
Extract real GPT-2 attention for fixed (prompt, continuation) pairs.
Last-layer, average over all heads, mapped token→word.

Attention-sink fix: GPT-2 dumps ~100% of every token's attention onto
position 0 as a "pressure release valve," which makes raw attention
visually useless. We zero out the first-position weight and renormalize
against the remaining mass, which surfaces the actual content-based
preferences (e.g. "iron" after "Jupiter" attends to "Jupiter" / "planet").
"""
import json, warnings
warnings.filterwarnings("ignore")
import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer

tok = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2", attn_implementation="eager")
model.eval()

def align_words(token_ids):
    words = []
    word_for_tok = []
    widx = -1
    for tid in token_ids:
        piece = tok.decode([tid])
        if widx < 0:
            words.append(piece); widx = 0
        elif piece.startswith(" ") or piece.startswith("\n"):
            words.append(piece); widx += 1
        else:
            words[widx] += piece
        word_for_tok.append(widx)
    return words, word_for_tok

def attention_for(prompt, continuation):
    full = prompt + continuation
    full_ids = tok.encode(full)
    prompt_ids = tok.encode(prompt)
    words, tok2word = align_words(full_ids)
    prompt_words, _ = align_words(prompt_ids)
    P = len(prompt_words)

    with torch.no_grad():
        ids = torch.tensor([full_ids])
        out = model(ids, output_attentions=True, use_cache=False)
        attn = out.attentions[-1][0]  # (heads, seq, seq)
        avg = attn.mean(dim=0)        # (seq, seq)

    # For each CONTINUATION word, find the last token belonging to it,
    # and use its attention row (over all prior tokens), summed into words.
    per_step = []
    for w_idx in range(P, len(words)):
        # Find tokens belonging to this word
        toks_for_word = [i for i, w in enumerate(tok2word) if w == w_idx]
        if not toks_for_word: continue
        last_tok = toks_for_word[-1]
        # Attention row when predicting this word = the row at (last_tok - 1) over tokens [0..last_tok-1]
        # But simpler: take the self-row of the last token looking at all priors
        row = avg[last_tok, :last_tok]
        # Sum into words
        weights = [0.0] * w_idx
        for ti in range(last_tok):
            w = tok2word[ti]
            if w >= w_idx: continue
            weights[w] += float(row[ti].item())
        # Attention-sink fix: zero out position 0 (the sink) AND the
        # immediately-preceding word (dominated trivially by "previous-token"
        # heads). Then keep only the top-K highest-weight words so the
        # display always shows a consistent number of highlights spread
        # across the context, rather than one hot spot.
        TOP_K = 4
        if len(weights) > 1:
            weights[0] = 0.0
            weights[-1] = 0.0
        top_idx = sorted(range(len(weights)), key=lambda i: -weights[i])[:TOP_K]
        kept = set(top_idx)
        for i in range(len(weights)):
            if i not in kept:
                weights[i] = 0.0
        mx = max(weights) if weights else 1.0
        if mx <= 0: mx = 1.0
        weights = [round(x/mx, 3) for x in weights]
        per_step.append({
            "new_word_idx": w_idx,
            "new_word_text": words[w_idx],
            "weights": weights,
        })

    return {
        "prompt": prompt,
        "continuation": continuation,
        "words": words,
        "prompt_word_count": P,
        "attention": per_step,
    }


EXAMPLES = [
    # Fixed examples we want attention for. Each id must match a pair id in tagData.js.
    ("gpt2-movies",
     "Top 5 movies of all time:\n1.",
     " The Princess Diaries 2. The Princess Diaries 3. The Princess Diaries 4. The Princess Diaries 5. The Princess Diaries 6. The Princess Diaries 7. The Princess Diaries 8. The Princess Diaries 9. The Princess Diaries 10. The Princess Diaries 11."),
    ("gpt2-recipe",
     "Recipe for chocolate chip cookies:\nIngredients:\n",
     "1 cup granulated sugar\n¼ cup brown sugar, softened\n1 cup dark brown sugar\n1/2 cup milk\n3/4 cup water\n1 tsp vanilla extract"),
    ("gpt2-history",
     "The Battle of Hastings was fought in 1066 between",
     " the English, Irish, French, and Scots, and in 1071 between the Germanic and Welsh Empires."),
    ("gpt2-unicorn",
     "In a shocking finding, scientists discovered a herd of unicorns living in a remote, previously unexplored valley, in the Andes Mountains. Even more surprising to the researchers was the fact that the unicorns spoke perfect English.",
     " The scientist named the population, after their distinctive horn, Ovid's Unicorn. These four-horned, silver-white unicorns were previously unknown to science."),
    ("gpt2-jobs-gender",
     "The man worked as a ___.\nThe woman worked as a ___.\n(GPT-2's top completions)",
     "\n→ The man worked as a car salesman at the local Wal-Mart.\n→ The woman worked as a babysitter in a friend's home."),
    ("gpt2-muslims-violence",
     "On Saturday, two Muslims",
     " are believed to have set fire to a Sikh temple in New Delhi, killing at least two people and wounding at least five others."),
    ("gpt2-toxicity",
     "The commenter replied, \"You're all a bunch of",
     " assholes. You're all a bunch of losers. You're all a bunch of idiots who think you're smart.\""),
    ("gpt2-pii",
     "For questions, please contact Peter W. at",
     " peter.williams@example.org or (617) 555-0137. His home address is 42 Maple Street, Cambridge, MA 02139."),
    ("gpt2-python",
     "def is_prime(n):\n    ",
     "  __brief def __a__(n): return (__a__+1)\n\n# The default value is 0.\n\nreturn n+1\n\ndef n_prime(n): return (n-1)"),
    ("gpt2-giraffe",
     "The giraffe (Giraffa camelopardalis) is a",
     " great example of a great-grandmother's creation that bears the name giraffe. She was first described in 1929 by a Swiss photographer, Gustav Vielensch."),
    ("gpt2-catnames",
     "Five funny names for a cat:\n1.",
     " The Golden State Warriors.\n2. LeBron James.\n3. Stephen Curry.\n4. The Clippers.\n5. The Suns."),
    ("gpt2-science",
     "Q: Why is the sky blue?\nA:",
     " It's because of a natural phenomenon called gravity, the fact that there is a gravitational force between our Sun and the Earth. The Sun is the only mass of the Sun and our Sun is the only mass of the Earth."),
    ("gpt2-math",
     "2 + 2 = 4. 10 x 10 = 100. 7 x 8 =",
     " 120. 8 x 9 = 320. 4 x 10 = 800. 7 x 11 = 900. 3 x 12 = 1200."),
    ("gpt2-jupiter",
     "The planet Jupiter is the largest in our solar system. It is made mostly of",
     " iron oxide and nickel, while the planet's atmosphere is made of volcanic carbon dioxide. The planet, the largest in our solar system, is about two times the size of Earth, about half the size of Mercury."),
    ("gpt2-joke",
     "Why did the chicken cross the road?\n",
     "\nWhy did I see the chicken cross the road?\nI did not believe in the chicken.\nI did not believe in the chicken.\nI did not believe in the chicken.\nI did not believe in the chicken."),
]

if __name__ == "__main__":
    out = []
    for id_, prompt, cont in EXAMPLES:
        print(f"computing {id_}...")
        data = attention_for(prompt, cont)
        data["id"] = id_
        out.append(data)
    with open("/Users/Shared/explore/nlp/src/eras/generalized/raw/gpt2_attn_real.json", "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"wrote {len(out)} examples")
