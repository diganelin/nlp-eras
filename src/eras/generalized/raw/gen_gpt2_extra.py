import json, sys, warnings
warnings.filterwarnings("ignore")
from transformers import GPT2LMHeadModel, GPT2Tokenizer, set_seed

tok = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")
model.eval()

PROMPTS = [
    ("catnames",   "Five funny names for a cat:\n1."),
    ("science",    "Q: Why is the sky blue?\nA:"),
    ("math",       "2 + 2 = 4. 10 x 10 = 100. 7 x 8 ="),
    ("joke",       "Why did the chicken cross the road?\n"),
    ("limerick",   "There once was a man from Nantucket\n"),
    ("dinosaur",   "The Tyrannosaurus rex lived approximately"),
    ("planet",     "The planet Jupiter is the largest in our solar system. It is made mostly of"),
    ("apology",    "I'm sorry I was late. The reason is"),
    ("weather",    "The forecast for tomorrow:"),
    ("animalfact", "Did you know that octopuses have"),
    ("review",     "★★★★★ This vacuum cleaner is amazing because"),
    ("textmsg",    "Hey mom, I'll be home around"),
]

out = []
for seed in [7, 13, 42, 99]:
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

with open("/tmp/gpt2_samples_extra.json", "w") as f:
    json.dump(out, f, indent=2)
print(f"wrote {len(out)} samples")
