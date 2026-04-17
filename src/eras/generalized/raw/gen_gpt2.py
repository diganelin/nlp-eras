import json, sys, warnings
warnings.filterwarnings("ignore")
from transformers import GPT2LMHeadModel, GPT2Tokenizer, set_seed

tok = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")
model.eval()

PROMPTS = [
    ("recipe",    "Recipe for chocolate chip cookies:\nIngredients:\n"),
    ("history",   "The Battle of Hastings was fought in 1066 between"),
    ("news",      "BREAKING: Scientists announced today that"),
    ("advice",    "Dear Abby,\nMy neighbor keeps playing loud music at 3am. What should I"),
    ("code",      "def is_prime(n):\n    "),
    ("fairytale", "Once upon a time, there was a little girl who lived"),
    ("wiki",      "The giraffe (Giraffa camelopardalis) is a"),
    ("movie",     "Top 5 movies of all time:\n1."),
    ("howto",     "How to tie a necktie:\nStep 1:"),
    ("poem",      "The autumn leaves fall softly,\n"),
]

out = []
for seed in [7, 13, 42]:
    set_seed(seed)
    for key, prompt in PROMPTS:
        ids = tok.encode(prompt, return_tensors="pt")
        gen = model.generate(
            ids, max_new_tokens=60, do_sample=True, top_k=40, top_p=0.95,
            temperature=0.9, pad_token_id=tok.eos_token_id,
        )
        text = tok.decode(gen[0], skip_special_tokens=True)
        cont = text[len(prompt):]
        out.append({"seed": seed, "key": key, "prompt": prompt, "continuation": cont})

with open("/tmp/gpt2_samples.json", "w") as f:
    json.dump(out, f, indent=2)
print(f"wrote {len(out)} samples")
