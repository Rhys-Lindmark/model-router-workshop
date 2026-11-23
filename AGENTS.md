# Instructions for coding agents

You are helping someone at a workshop build a model router on their own machine. A model router sends each prompt to the cheapest model that will answer it correctly. In this repo, Jev (a small judgment model from TypeSafe) answers questions about the prompt with probabilities, and a truth table in code turns those answers into a model and a reasoning effort.

The person may have pasted: “Set up https://github.com/Rhys-Lindmark/model-router-workshop and help me build my own model router. Follow its AGENTS.md.” The workshop has three levels, and the speaker shows each one before attendees build it. Go at their pace: do setup now, then help with whichever level they ask about. After each step, tell them in a sentence or two what happened. Keep it short: they are also listening to a talk.

## Ground rules

- Node 22 or newer. There are no dependencies: never run `npm install`.
- **Never ask the person to paste an API key into the chat.** Ask them to open `.env` in their editor and paste it there themselves. Never print `.env` or echo a key.
- Setup and every level work offline on the eval prompts. Don’t block on keys.
- The person’s work goes in `starter/`. Don’t edit `src/` or `data/` to make a score look better.
- Suggest rows and questions, but let the person choose them: the point is that they learn to decompose a decision. Write the whole thing for them only if they ask.
- Before you claim a result, run the command and quote its output.

## Setup

```bash
git clone https://github.com/Rhys-Lindmark/model-router-workshop.git
cd model-router-workshop
npm run doctor
npm run app
```

`npm run app` serves their router page at http://localhost:3401 and keeps running. Start it in the background, or ask them to run it in their own terminal, and tell them to open the URL. It has one tab per level. If Node is older than 22, help them install it (`nvm install 22 && nvm use 22`, or their package manager).

## Keys (when they’re ready)

Follow `docs/KEYS.md`:

1. Jev key from https://console.typesafe.ai/keys. OpenRouter key from https://openrouter.ai/keys.
2. `cp .env.example .env`, then they paste both keys into `.env` themselves.
3. `npm run doctor -- --live` should print two ✓ lines. Then they restart `npm run app`.

Jev is in early access. Without a Jev key they can still do everything on the eval prompts (the chips in the app, `npm run route -- --offline <id>`, `npm run score`).

## Level 1 · Ask for the decision

File: `starter/choice.js`, one Choice question: “Which model should I use for this prompt?”.

- In the app’s Level 1 tab, they click prompts and see Jev’s probabilities, the pick, and how every option did on that prompt in the eval.
- Help them judge whether it’s a good question. The human test: could a smart person answer it from the prompt alone, without asking what the user cares about? (No: it depends on cost and quality preferences the prompt doesn’t contain, and “Opus” is a label, not a description.)
- If they rewrite the Choice, option keys must be `haiku`, `sonnet`, `opus` or `fable`. `npm run ask` (Jev key) gets answers for all 168 eval prompts, and then `npm run score` lists it as “Your Choice”.

## Level 2 · Judgments + a table

Files: `starter/policy.js` (the table) and `starter/questions.js` (their own judgments).

- The table is ordered rows of `{ when, test: j => …, option }`; first match wins; the last row must always match. Options are `haiku:low`, `haiku:high`, `sonnet:low`, `sonnet:high`, `opus:low`, `opus:high`.
- `j` already has nine judgments from the eval: `exact_details`, `long_procedure`, `quick_recall`, `writes_code`, `large_output`, `expertise`, `high_stakes`, `nuanced_writing` (true at ≥ 0.5) and `depth` (0 to 3). `j.p.<name>` is the raw probability.
- A good new question is a judgment about the prompt (“Does a correct answer depend on exact digits?”), not a decision (“Does this need a big model?”). After they add one: refresh the app (typed prompts ask it live), and run `npm run ask` to get its answers for the eval prompts.
- Terminal version: `npm run route -- --policy starter "How many r's are in strawberry?"`.

## Level 3 · Check it with an eval

```bash
npm run score -- --policy starter --misses
```

The app’s Level 3 tab shows the same thing. Read the misses with them and ask what the failing prompts have in common. The usual finding: the small model fails on exact letters and digits (big multiplications, “no letter e”, counting days across years), not on expert or high-stakes questions.

Targets: Bronze matches “Which model?” for less, Silver beats Router v2, Gold matches the best fixed choice for less. Each must also beat random routing. Gold is reachable with three rows. The spoiler is in `docs/WORKSHOP.md`; show it only if they ask. Warn them once that they can see the test results, so they can overfit.

Then their own eval: help them replace the examples in `starter/my-eval.js` with 5 to 10 prompts from their own project, each with a `check` (helpers `number`, `says`, `without`, `atLeastWords`, `all`, or any function of the reply text). Then:

```bash
npm run my-eval      # both keys; runs all six options per prompt; capped at $1 (MY_EVAL_BUDGET_USD)
```

Have them read a few failed replies in `data/my-eval-results.json` to check that the checks are right.

## Done

```bash
npm run chat         # Jev judges, their table picks, the picked model answers
```

To use it in their own app, `src/router.js` exports `loadPolicy()`, `routePrompt(prompt, policy)` and `callModel(option, prompt)`.

## Repo map

- `starter/`: their files (choice.js, questions.js, policy.js, my-eval.js).
- `app/index.html`, `scripts/app.js`: the local router page and its server. Keys stay on the server.
- `src/questions.js`, `src/policy.js`: the speaker’s questions, Router v1, Router v2 and the Choice. `src/levels.js`: loads `starter/` fresh on each request.
- `src/score.js`, `src/eval.js`: offline scoring. `src/route.js`: route one prompt. `src/router.js`: the router as a library. `src/jev.js`: the Jev client.
- `data/eval.json`: the speaker’s eval. `docs/`: workshop guide, keys, facilitator guide. `slides/`: the talk.
