# Building a model router

A hands-on AI Engineer workshop. You build a model router on your own machine in three levels, and at each level I show you mine first:

1. **Ask for the decision.** One question to Jev: “Which model should I use?” Is that a good question?
2. **Judgments + a table.** Break the decision into questions a smart person could answer from the prompt alone, and decide in code.
3. **Check it with an eval.** Run every model on graded prompts, score every router against fixed, perfect and random routing, then build an eval for your own project.

On my eval’s 168 test prompts:

| Router | Passed | Cost per 1,000 prompts |
| - | - | - |
| Level 1: “Which model should I use?” | 85.7% | $7.37 |
| Level 2: my first table (Router v1) | 80.4% | $2.76 |
| Level 2, after the eval: Router v2 | **91.1%** | **$3.20** |
| Always the large model, high effort | 94.6% | $11.08 |

The live version of my router: [ai.rhyslindmark.com/jev/model-router](https://ai.rhyslindmark.com/jev/model-router).

**[Slides](https://rhys-lindmark.github.io/model-router-workshop/slides/)** · **[Workshop guide](docs/WORKSHOP.md)** · **[Keys](docs/KEYS.md)** · **[Facilitator guide](docs/FACILITATOR.md)** · **[For coding agents](AGENTS.md)**

## Start

Paste this into your coding agent (Claude Code, Codex, Cursor…):

> Set up https://github.com/Rhys-Lindmark/model-router-workshop and help me build my own model router. Follow its AGENTS.md.

Or do it yourself. You need Git and Node.js 22 or newer. There is nothing to install:

```bash
git clone https://github.com/Rhys-Lindmark/model-router-workshop.git
cd model-router-workshop
npm run doctor
npm run app        # your router page at http://localhost:3401
```

The app works without keys on prompts from the eval, using Jev’s saved answers. To route your own prompts and have real models answer them, add two keys ([docs/KEYS.md](docs/KEYS.md)):

```bash
cp .env.example .env          # paste TYPESAFE_API_KEY and OPENROUTER_API_KEY in your editor
npm run doctor -- --live      # checks both keys
```

## The levels

| Level | You edit | You run | You learn |
| - | - | - | - |
| 1 · Ask for the decision | [starter/choice.js](starter/choice.js) | `npm run app` (Level 1 tab) | Calling Jev, and why a decision question is a weak question |
| 2 · Judgments + a table | [starter/questions.js](starter/questions.js), [starter/policy.js](starter/policy.js) | `npm run app` (Level 2 tab), `npm run route -- --policy starter "…"` | Decomposing a decision into judgments; keeping policy in code |
| 3 · Check it with an eval | [starter/my-eval.js](starter/my-eval.js) | `npm run score`, `npm run my-eval`, app (Level 3 tab) | Scoring against fixed, perfect and random routing; building your own eval |
| Done | | `npm run chat` | Your router end to end: Jev judges, your table picks, the model answers |

Targets for your table on my eval. Each also has to beat random routing:

| | Goal | Passed | Cost per 1,000 |
| - | - | - | - |
| Bronze | Match “Which model should I use?” for less | ≥ 85.7% | ≤ $7.37 |
| Silver | Beat Router v2 | > 91.1% | ≤ $3.32 |
| Gold | Match the best fixed choice (medium model, high effort) for less | ≥ 93.5% | < $3.32 |

## Commands

| Command | Needs | What it does |
| - | - | - |
| `npm run app` | nothing (keys for typed prompts) | Your router page, with a tab per level |
| `npm run score` | nothing | Scores every router on the 168 test prompts. `--policy starter --misses` shows where yours went wrong. |
| `npm run route -- "…"` | Jev key (or `--offline <id>`) | Routes one prompt in the terminal. `--run` sends it to the picked model. |
| `npm run ask` | Jev key | Asks your questions (and your edited Choice) about all 168 prompts, so `score` can use them |
| `npm run my-eval` | both keys | Runs your own eval: every option on your prompts, graded by your checks. Capped at $1. |
| `npm run chat` | both keys | Your finished router, interactive |
| `npm run slides` | nothing | The deck at http://localhost:3402 |
| `npm run doctor` | nothing | Checks setup. `-- --live` checks your keys. |
| `npm test` | nothing | Checks the repo reproduces the published numbers |

## Present

- The deck is online at [rhys-lindmark.github.io/model-router-workshop/slides/](https://rhys-lindmark.github.io/model-router-workshop/slides/), or run it locally with `npm run slides` (works offline). Use ← → to move and reveal, **N** for speaker notes, **P** for the presenter view (current and next slide, notes, timer), **F** for fullscreen. To print or save a PDF, use the browser’s Print.
- Two run-of-shows, 15 and 45 minutes, are in [docs/FACILITATOR.md](docs/FACILITATOR.md).
- The first version of the talk, a straight 15-minute presentation, is archived in [slides/v1/](slides/v1/) with its PDF.

## Repository

| Path | What it is |
| - | - |
| [starter/](starter/) | Your files: `choice.js` (Level 1), `questions.js` and `policy.js` (Level 2), `my-eval.js` (Level 3) |
| [app/](app/) · [scripts/app.js](scripts/app.js) | Your local router page and its small server (keys stay on the server) |
| [src/questions.js](src/questions.js) · [src/policy.js](src/policy.js) | My questions and tables: Router v1, Router v2 and the Choice |
| [src/router.js](src/router.js) | The router as a library: `routePrompt()` and `callModel()` |
| [src/jev.js](src/jev.js) | A minimal Jev client: one POST to `https://api.typesafe.ai/v1/systemone` |
| [src/score.js](src/score.js) · [src/eval.js](src/eval.js) · [src/levels.js](src/levels.js) | Scoring against perfect, fixed and random routing |
| [data/eval.json](data/eval.json) | My eval’s 168 test prompts, Jev’s answers, and each option’s pass and cost |
| [slides/](slides/) | The deck, its screenshots, and the archived v1 |
| [docs/](docs/) | Workshop guide, keys, facilitator guide |

## About my eval

228 prompts in five categories (math, code, writing, logic and facts), every answer checked by code: computed answers, hidden tests for code, and mechanical checks like “exactly 12 words”. Each ran once on Qwen 3.7 Flash, Plus and Max, at low and high reasoning effort. Those three play the small, medium and large tiers that the router names Haiku, Sonnet and Opus. Router v2 was built from 60 training prompts; every score here is on the other 168. Jev `jev-1.14.0`, 2026-11-21, total cost $15. The repo sums per-run costs rounded to a millionth of a dollar, so a cost can differ from the live page by a cent.

Limits: one run per prompt and option, open stand-in models rather than the Claude tiers, and graded puzzles rather than real traffic.

## License

MIT
