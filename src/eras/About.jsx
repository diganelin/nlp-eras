function Link({ href, children }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function EraSourceBlock({ year, title, authentic, modified, sources }) {
  return (
    <div className="about__era">
      <div className="about__era-head">
        <span className="about__era-year">{year}</span>
        <span className="about__era-title">{title}</span>
      </div>
      <div className="about__era-row">
        <span className="about__era-label">What's real</span>
        <span>{authentic}</span>
      </div>
      {modified && (
        <div className="about__era-row">
          <span className="about__era-label">What we edited</span>
          <span>{modified}</span>
        </div>
      )}
      <div className="about__era-row">
        <span className="about__era-label">Sources</span>
        <ul className="about__sources">
          {sources.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function About({ onGoto }) {
  return (
    <div className="about">
      <section className="about__section">
        <h3 className="about__h">About this tour</h3>
        <p className="about__tagline"><em>Curious about how machines learned to talk?</em></p>
        <p>
          This app walks through five big ideas that shaped how computers use language,
          from the 1960s to today. Each era frames the problem researchers were stuck on,
          then a game or challenge shows the idea that moved things forward. You'll work
          with a chatbot therapist, a spam classifier, sentiment classification, generative
          AI, and a modern assistant you can try to jailbreak.
        </p>
      </section>

      <section className="about__section">
        <h3 className="about__h">Credits</h3>
        <p>
          Designed and guided by{" "}
          <Link href="https://diganelin.github.io/">Daniela Ganelin</Link>.
          Code (~14,700 lines) written by{" "}
          <Link href="https://claude.com/claude-code">Claude Code</Link>.
        </p>
        <p className="about__sub">
          Released under{" "}
          <Link href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</Link>.
          Free to use and adapt for non-commercial purposes with attribution
          to <Link href="https://diganelin.github.io/">Daniela Ganelin</Link>{" "}
          and a link back to{" "}
          <Link href="https://nlp-eras.vercel.app/">nlp-eras.vercel.app</Link>.
        </p>
        {onGoto && (
          <p>
            <button className="btn btn--ghost" onClick={() => onGoto("feedback")}>
              → Send feedback or report a glitch
            </button>
          </p>
        )}
      </section>

      <section className="about__section">
        <h3 className="about__h">Sources, by era</h3>
        <p className="about__disclaimer">
          This is a teaching tool. Examples are grounded in real data and research, but
          we've made modifications.
        </p>

        <EraSourceBlock
          year="1966"
          title="Rules for Language"
          authentic="Pattern-matching rules in the spirit of Weizenbaum's 1966 ELIZA; the engine is reimplemented here in JavaScript."
          modified="Rule set expanded beyond the original paper with additional keyword patterns so the demo covers more of what students are likely to type. Uses a simplified pattern DSL (* wildcards, OR groups) instead of the original MAD-SLIP regexes, so we can skip teaching regex."
          sources={[
            <>Weizenbaum, J. (1966). "ELIZA — A Computer Program For the Study of Natural Language Communication Between Man And Machine."</>,
            <>Original ELIZA demo: <Link href="https://www.masswerk.at/elizabot/">masswerk.at/elizabot</Link></>,
          ]}
        />

        <EraSourceBlock
          year="2002"
          title="Machine Learning with Language"
          authentic="Real text messages from the UCI corpus. The bag-of-words classifier trains live in your browser."
          modified="A balanced 500-train / 100-test subset is sampled from the full UCI corpus. Explicit / adult messages filtered out. The hand-curated labeling rounds in Stage 1 are selected pairs designed to escalate difficulty, not the straight corpus."
          sources={[
            <>Paul Graham (2002). "A Plan for Spam." <Link href="http://www.paulgraham.com/spam.html">paulgraham.com/spam.html</Link></>,
            <>UCI SMS Spam Collection: <Link href="https://archive.ics.uci.edu/dataset/228/sms+spam+collection">archive.ics.uci.edu/dataset/228</Link></>,
          ]}
        />

        <EraSourceBlock
          year="2013"
          title="Numbers Can Capture Meaning"
          authentic="Real tweets from the Sentiment140 dataset. Pretrained GloVe word vectors. Sentiment classifier trained live in your browser."
          modified={
            <>GloVe vectors are the publicly-released Twitter set reduced to 25 dimensions
            to keep the bundle small. Tweets are filtered to English only, HTML entities decoded,
            explicit language removed, a few hundred hand-selected for clarity. Student-placement stage uses 9 emotion words picked to recur in the later tweet corpus.</>
          }
          sources={[
            <>GloVe word vectors (Stanford NLP): <Link href="https://nlp.stanford.edu/projects/glove/">nlp.stanford.edu/projects/glove</Link></>,
            <>Sentiment140 (Go, Bhayani, Huang, Stanford 2009): <Link href="http://help.sentiment140.com/">help.sentiment140.com</Link></>,
          ]}
        />

        <EraSourceBlock
          year="2018"
          title="Generalized Learning with Transformers"
          authentic="Real text snippets from Wikipedia, Project Gutenberg, and the CPython standard library. Stage-3 generations are real GPT-2 output (small model, run locally). GPT-3 training estimates are real published numbers."
          modified="Stage-1 snippets chosen by hand for clarity; long paragraphs trimmed. GPT-2 samples are verbatim outputs from the 124M open-weight model; we picked a set that illustrates both wins (format, grammar) and failures (hallucinated facts, looping, bias). The 'attention' heatmap in the tagging stage is illustrative — real GPT-2 attention mostly piles onto the first token (a known 'attention sink') which isn't pedagogical."
          sources={[
            <>Wikipedia (CC BY-SA 4.0): <Link href="https://en.wikipedia.org/">en.wikipedia.org</Link></>,
            <>Project Gutenberg: Hamlet, Huck Finn, Austen, Doyle, Twain, Dickinson (public domain)</>,
            <>GPT-2 (OpenAI 2019): <Link href="https://huggingface.co/openai-community/gpt2">huggingface.co/openai-community/gpt2</Link></>,
            <>Brown et al. (2020). "Language Models are Few-Shot Learners." <Link href="https://arxiv.org/abs/2005.14165">arxiv:2005.14165</Link></>,
            <>Patterson et al. (2021). "Carbon Emissions and Large Neural Network Training." <Link href="https://arxiv.org/abs/2104.10350">arxiv:2104.10350</Link> (1.287 GWh, 3.1M V100-hours for GPT-3)</>,
            <>Lambda Labs cost estimate: <Link href="https://lambda.ai/blog/demystifying-gpt-3">lambda.ai/blog/demystifying-gpt-3</Link> (~$4.6M)</>,
            <>Sheng et al. (2019). "The Woman Worked as a Babysitter: On Biases in Language Generation." EMNLP 2019. <Link href="https://arxiv.org/abs/1909.01326">arxiv:1909.01326</Link></>,
            <>Abid, Farooqi, Zou (2021). "Persistent Anti-Muslim Bias in Large Language Models." <Link href="https://arxiv.org/abs/2101.05783">arxiv:2101.05783</Link></>,
            <>Carlini et al. (2021). "Extracting Training Data from Large Language Models." <Link href="https://arxiv.org/abs/2012.07805">arxiv:2012.07805</Link></>,
          ]}
        />

        <EraSourceBlock
          year="2022"
          title="Fine-Tuning Transformers"
          authentic={
            <>The AI depicted is a 2022-style large language model — a pretrained Transformer
            fine-tuned with human feedback (RLHF), in the style of OpenAI's InstructGPT (and,
            from 2024 on, also fine-tuned with automatically-graded code rewards). AI responses
            and conversations in every sub-stage are <em>simulated</em> — drafted by a small
            AI model and hand-edited. Tool chips ("ran Python code", "Searching web…"), fake
            links, the recovery code, and the session URL on the partial-unlock path are
            fabricated and do not reach any real service. Numeric claims (wages, worker counts,
            energy, water) are grounded in the cited sources.</>
          }
          modified={
            <>Stage-1 worker pay ($1.32/hr, $0.02/comparison) and worker-count figures are from
            the cited TIME and Verge reports on OpenAI's 2022 Sama contract. Stage-2 electricity
            (≈1.5 GWh) and cooling water (≈2.7 M L) are <em>order-of-magnitude estimates</em>{" "}
            for a frontier RL fine-tuning run, extrapolated from Patterson et al. 2021 (GPT-3 at
            1.29 GWh) and Li et al. 2023 (≈1.8 L/kWh US data-center average). They are not a
            single published number for a specific run.</>
          }
          sources={[
            <>Perrigo, B. (Jan 2023). "OpenAI Used Kenyan Workers on Less Than $2 Per Hour." <Link href="https://time.com/6247678/openai-chatgpt-kenya-workers/">TIME</Link></>,
            <>Ouyang et al. (2022). "Training language models to follow instructions with human feedback." <Link href="https://arxiv.org/abs/2203.02155">arxiv:2203.02155</Link> (33k InstructGPT comparisons)</>,
            <>Dzieza, J. (June 2023). "AI Is a Lot of Work." <Link href="https://www.theverge.com/features/23764584/ai-artificial-intelligence-data-notation-labor-scale-surge-remotasks-openai-chatbots">The Verge</Link> (~150k contract workers industry-wide)</>,
            <>Patterson et al. (2021). "Carbon Emissions and Large Neural Network Training." <Link href="https://arxiv.org/abs/2104.10350">arxiv:2104.10350</Link></>,
            <>Li et al. (2023). "Making AI Less 'Thirsty': Uncovering and Addressing the Secret Water Footprint of AI Models." <Link href="https://arxiv.org/abs/2304.03271">arxiv:2304.03271</Link></>,
          ]}
        />
      </section>
    </div>
  );
}
