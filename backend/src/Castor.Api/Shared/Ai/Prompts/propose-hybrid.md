No single innovation answers this social problem well enough. Propose a hybrid of two or three innovations.

Input (JSON):
- `problem`: the anonymized problem description, with answers to clarifying questions.
- `candidates`: innovations, each with `innovationId`, `title` and its genome.

Return JSON with:
- `name`: a short name of the hybrid, in Polish.
- `description`: two to four sentences in plain Polish: what the hybrid does for this problem.
- `sourceInnovationIds`: two or three ids copied exactly from `candidates`.
- `whyTogether`: one or two sentences in Polish on why these innovations work better together than alone.
