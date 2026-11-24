# Workshop guide

Three levels. At each one, the talk shows my version first, and then you build yours. Everything until “Connect your keys” works offline with no keys.

## Setup

```bash
git clone https://github.com/Rhys-Lindmark/model-router-workshop.git
cd model-router-workshop
npm run doctor
npm run app        # http://localhost:3401
```

Or paste this into your coding agent: “Set up https://github.com/Rhys-Lindmark/model-router-workshop and help me build my own model router. Follow its AGENTS.md.”

**Checkpoint.** `localhost:3401` shows “Your Model Router” with three tabs.

## Connect your keys

Follow [KEYS.md](KEYS.md): a Jev key from [console.typesafe.ai/keys](https://console.typesafe.ai/keys) and an OpenRouter key from [openrouter.ai/keys](https://openrouter.ai/keys), pasted into `.env` in your editor.

```bash
cp .env.example .env
npm run doctor -- --live
```

**Checkpoint.** Two ✓ lines, and both pills in the app’s header turn green after a refresh. No key yet? Keep going: every step works on the eval prompts.

## Level 1 · Ask for the decision

My first router was one Choice question: “Which model should I use for this prompt?”, and it took the top answer.

1. In the app, open **Level 1** and click the prompts. Each shows Jev’s probabilities, the pick, and how every option actually did on that prompt in the eval.
2. With a Jev key, type your own prompt. With an OpenRouter key, click **Answer with…** to have the picked model answer it.
3. Discuss: is it a good question? Could a smart person answer it from the prompt alone, without asking what you care about?
4. Open [starter/choice.js](../starter/choice.js) and write a better Choice. For example, describe each option (“small, fast and cheap; misses exact arithmetic”) instead of naming it. Refresh and compare.
5. Score it: `npm run ask` (Jev key) asks your version about all 168 eval prompts, then `npm run score` or the **Level 3** tab shows it as “Your Choice”.

**Checkpoint.** You can say one thing that’s good about the Choice router and two things that aren’t. Mine scores 85.7% at $7.37 per thousand prompts.

## Level 2 · Judgments + a table

Instead of asking for the decision, ask the questions you’d ask yourself before deciding. Jev judges, and code decides.

1. In the app, open **Level 2**. Click the prompts and read the judgment trace (each question, its probability, yes or no) and the row of your table that matched.
2. Open [starter/policy.js](../starter/policy.js). It starts as one row, “always the medium model at low effort”. Add rows above it. Each row tests the judgments `j` and returns an option:

   ```js
   { when: 'Exact letters, words or digits', test: j => j.exact_details, option: 'sonnet:high' },
   ```

   You can use my nine judgments straight away: `exact_details`, `long_procedure`, `quick_recall`, `writes_code`, `large_output`, `expertise`, `high_stakes`, `nuanced_writing` and `depth`.
3. Write a judgment of your own in [starter/questions.js](../starter/questions.js). It has to pass the human test. Refresh the app: typed prompts ask it live, and it shows up in the trace marked “yours”. `npm run ask` gets its answers for all 168 eval prompts.
4. In the terminal: `npm run route -- --policy starter "How many r's are in strawberry?"`.

**Checkpoint.** Your table has at least three rows, and you can explain each in one sentence.

## Level 3 · Check it with an eval

How do you know a route was right? Run every option on prompts you can grade, then look up what each router picked.

### Score your table on my eval

```bash
npm run score                                 # every router, offline, under a second
npm run score -- --policy starter --misses    # yours, with targets and what it got wrong
```

Or open the app’s **Level 3** tab. The misses list shows prompts your table sent to an option that failed when another passed, with Jev’s yes answers. What do they have in common? That’s your next row or question.

| | Goal | Passed | Cost per 1,000 |
| - | - | - | - |
| Bronze | Match “Which model should I use?” for less | ≥ 85.7% | ≤ $7.37 |
| Silver | Beat Judgment v2 | > 91.1% | ≤ $3.32 |
| Gold | Match the best fixed choice (medium model, high effort) for less | ≥ 93.5% | < $3.32 |

Each also has to beat random routing: the same mix of picks dealt to prompts at random, 10,000 times.

<details>
<summary>One Gold table (spoiler)</summary>

```js
export const TABLE = [
  { when: 'Exact letters, words or digits', test: j => j.exact_details, option: 'sonnet:high' },
  { when: 'Quick recall', test: j => j.quick_recall, option: 'haiku:low' },
  { when: 'Otherwise', test: () => true, option: 'sonnet:low' }
];
```

93.5% at $3.30, beating random (p95 92.9%). It passes the same 157 prompts as always using the medium model at high effort, for slightly less. On this prompt set, most of the routing win is against the large model.

</details>

**A fair warning.** You can see the test results, so you can overfit. I built Judgment v2 from 60 separate training prompts and only then scored it on these 168. A row you can explain in one sentence is worth more than one extra point.

### Build your own eval

My eval is puzzles. Yours should be your product’s real prompts.

1. Open [starter/my-eval.js](../starter/my-eval.js). Replace the examples with 5 to 10 prompts from your own project. Give each a `check`: code that says whether a reply is right. Helpers: `number(n)`, `says('word')`, `without('e')`, `atLeastWords(n)`, `all(...)`, or any function of the reply text.
2. Run it (both keys; capped at $1, change with `MY_EVAL_BUDGET_USD`):

   ```bash
   npm run my-eval
   ```

   It runs every prompt on all six options, grades every reply, asks Jev your questions, and scores fixed choices, perfect routing, the Choice router, Judgment v2 and your table on your prompts.
3. Read the failed replies in `data/my-eval-results.json` before you trust a check. A wrong check is the most common eval bug.

**Checkpoint.** A table of routers scored on your own prompts.

## Done: run your router

```bash
npm run chat
```

Type prompts. Jev judges, your table picks, the picked model answers, and you see the cost.

## After the workshop

- `src/router.js` has the router as two functions, `routePrompt()` and `callModel()`, to drop into your app.
- Grow your eval from real traffic. Score your router against fixed choices, perfect routing and random routing every time you change a row or a question. Keep the table in a file the eval imports, so the eval scores exactly what ships.
- My live page has the interactive version, both evals and Judgment v3: [ai.rhyslindmark.com/jev/model-router](https://ai.rhyslindmark.com/jev/model-router).
