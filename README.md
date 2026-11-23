# Don’t ask the model which model

A 15-minute AI Engineer session on routing prompts to the right model. An LLM makes small **judgments** about each prompt, and a **truth table in code** turns them into a model and a reasoning effort. Then an eval checks whether it works.

On 168 held-out prompts graded by code:

| Policy | Passed | Cost per 1,000 prompts |
| - | - | - |
| Ask the LLM “Which model should I use?” | 85.7% | $7.37 |
| **Router v2:** Jev’s judgments and a truth table | **91.1%** | **$3.20** |
| Router v3: the same judgments and a small learned model | 93.5% | $3.25 |
| Always the medium model, high effort | 93.5% | $3.32 |
| Always the large model, high effort | 94.6% | $11.08 |

The interactive version is at [ai.rhyslindmark.com/jev/model-router](https://ai.rhyslindmark.com/jev/model-router).

**[Slides (PDF)](slides/DECK.pdf)** · **[Workshop guide](docs/WORKSHOP.md)** · **[Facilitator guide](docs/FACILITATOR.md)**

## Before you arrive

- Git, and Node.js 22 or newer. No `npm install`: the repo has no dependencies.
- That’s all for the core exercise. Scoring runs offline on the saved eval results and needs no API keys.
- Optional: a [TypeSafe](https://docs.typesafe.ai/) key to route your own prompts through Jev live, and an [OpenRouter](https://openrouter.ai/keys) key to send them on to the picked model.

## Clone and set up

```bash
git clone https://github.com/Rhys-Lindmark/model-router-workshop.git
cd model-router-workshop
npm run doctor
npm run score
```

For the optional live steps:

```bash
cp .env.example .env    # then add TYPESAFE_API_KEY (and OPENROUTER_API_KEY)
```

## Build during the workshop

| Step | What you do | What to check |
| - | - | - |
| 1 · Score | `npm run score` | The table above, plus perfect and random routing, in under a second |
| 2 · Route | `npm run route -- --offline calendar-15` | Jev’s judgments, the matched row, and the pick. With a key: `npm run route -- "your prompt"` |
| 3 · Write a table | Edit [starter/policy.js](starter/policy.js), then `npm run score -- --policy starter --misses` | Bronze, Silver or Gold, and that it beats random routing |
| 4 · Ask a new question (bonus) | Add a question to [starter/questions.js](starter/questions.js), then `npm run ask` | Use it as `j.<name>` in your table and score again |

Targets for step 3, on the held-out prompts. Each also has to beat random routing with the same mix of picks.

| | Goal | Passed | Cost per 1,000 |
| - | - | - | - |
| Bronze | Match “Which model should I use?” for less | ≥ 85.7% | ≤ $7.37 |
| Silver | Beat Router v2 | > 91.1% | ≤ $3.32 |
| Gold | Match the best fixed choice (medium model, high effort) for less | ≥ 93.5% | < $3.32 |

[docs/WORKSHOP.md](docs/WORKSHOP.md) has the steps, hints and checkpoints.

## Present

- `npm run slides` serves the deck at http://localhost:3402. You can also open `slides/index.html` directly.
- Keys: ← → to move, **N** for speaker notes, **P** for presenter view (current and next slide, notes and a timer, kept in sync with the main window), **F** for fullscreen.
- Timing: about 11 minutes of slides with one live demo, 3 minutes for the room to run step 1, and 1 minute for questions. Steps 2 to 4 continue after the session.
- [docs/FACILITATOR.md](docs/FACILITATOR.md) has the run of show, what to say on each slide, and what to do if the Wi-Fi fails.
- `slides/DECK.pdf` is the same deck as a PDF.

## Repository

| Path | What it is |
| - | - |
| [src/questions.js](src/questions.js) | The questions the router asks Jev about a prompt. No model names, no prices. |
| [src/policy.js](src/policy.js) | The truth tables (Router v1 and v2) and the anti-pattern. Jev judges; this file decides. |
| [src/route.js](src/route.js) | Routes one prompt and prints the judgments, the matched row and the pick |
| [src/score.js](src/score.js) · [src/eval.js](src/eval.js) | Scores any policy against perfect, fixed and random routing |
| [src/jev.js](src/jev.js) | A minimal Jev client: one POST to `https://api.typesafe.ai/v1/systemone` |
| [starter/](starter/) | Your table and your questions |
| [data/eval.json](data/eval.json) | The held-out eval: 168 prompts, Jev’s answers, and each option’s pass and cost |
| [slides/](slides/) | The HTML deck with speaker notes, and its PDF |
| [docs/](docs/) | Workshop guide and facilitator guide |
| [test/](test/) | Checks that the repo reproduces the published numbers (`npm test`) |

## About the eval

228 prompts in five categories (math, code, writing, logic and facts), every answer checked by code: computed answers, hidden tests for code, and mechanical checks such as “exactly 12 words”. Each prompt ran once on three open models from one family, Qwen 3.7 Flash, Plus and Max, at low and high reasoning effort. They stand in for the small, medium and large tiers the router names Haiku, Sonnet and Opus. Router v2 was built from 60 training prompts; every score here is on the other 168. Jev version `jev-1.14.0`, run on 2026-11-21, total cost $15. The repo sums per-run costs rounded to a millionth of a dollar, so a cost can differ from the live page by a cent ($7.36 here for “Which model?”, $7.37 there).

Limits: one run per prompt and option, open stand-in models rather than the Claude tiers, and graded puzzles rather than real traffic. The full write-up, including Router v3 and the pilot eval, is on [the live page](https://ai.rhyslindmark.com/jev/model-router).

## License

MIT
