# Workshop guide

Four steps. Steps 1 to 3 need no API keys and no internet once you’ve cloned. Each step ends with a checkpoint.

## Step 1 · Score every policy

```bash
npm run score
```

Every one of the 168 prompts was already run on every option (three model sizes × two reasoning efforts) and graded by code, so scoring a routing policy is a lookup. It takes under a second.

**Checkpoint.** You should see these rows, among others:

```text
Perfect routing (cheapest option that passed)    97.0%   $1.70
Router v3: Jev judgments + learned odds          93.5%   $3.25  yes (p95 90.5%)
Always Qwen 3.7 Plus · high effort               93.5%   $3.32
Router v2: Jev judgments + table                 91.1%   $3.20  yes (p95 88.7%)
"Which model should I use?" (high effort)        85.7%   $7.36  yes (p95 81.5%)
Router v1: the original table                    80.4%   $2.76  yes (p95 78.6%)
```

The last column is the random-routing test. It keeps a router’s mix of picks and deals them to prompts at random 10,000 times. A router “beats random” if it scores above the 95th percentile of those shuffles. A router that can’t beat random isn’t routing: it’s a price mix.

## Step 2 · Route a prompt

```bash
npm run route -- --offline calendar-15
```

This replays a prompt from the eval with Jev’s saved answers. You’ll see:

1. **Jev judges.** Each question about the prompt and the probability Jev gave it.
2. **Code decides.** The Router v2 table, with the first row that matched.
3. **Route.** The model and effort, what “Which model should I use?” would have picked, and how the pick did in the eval.

Try other ids from the eval: `letters-01`, `multiply-14`, `lipogram-08`, `knights-05`. `npm run score -- --policy v2 --misses` lists more, with their ids.

With a `TYPESAFE_API_KEY` in `.env`, route your own prompts live:

```bash
npm run route -- "Write a haiku about Monday mornings"
npm run route -- --policy v1 "Review the non-compete clause in my contract"
npm run route -- --json "Convert 72°F to Celsius"     # the exact Jev request and response
```

With an `OPENROUTER_API_KEY` too, add `--run` to send the prompt to the model the router picked.

**Checkpoint.** For `calendar-15` the route is `Qwen 3.7 Plus · high effort (sonnet:high)`, from row 1, “Exact details and a long procedure”.

## Step 3 · Write your own table

Open [starter/policy.js](../starter/policy.js). It starts with a single row, “always the medium model at low effort”:

```bash
npm run score -- --policy starter
```

That scores 89.3% at $2.74, which already beats “Which model should I use?”, but it doesn’t beat random routing, because it isn’t routing. Add rows above the last one. Each row tests the judgments `j` and returns an option:

```js
{ when: 'Exact letters, words or digits', test: j => j.exact_details, option: 'sonnet:high' },
```

After each change:

```bash
npm run score -- --policy starter --misses
```

`--misses` lists the prompts your table sent to an option that failed when another option passed, grouped by category, with Jev’s yes answers for each. Read them and ask what they have in common. That’s how Router v2 was written.

| | Goal | Passed | Cost per 1,000 |
| - | - | - | - |
| Bronze | Match “Which model should I use?” for less | ≥ 85.7% | ≤ $7.37 |
| Silver | Beat Router v2 | > 91.1% | ≤ $3.32 |
| Gold | Match the best fixed choice (medium model, high effort) for less | ≥ 93.5% | < $3.32 |

Each also has to beat random routing.

Hints, if you want them:

1. The small model miscounts. Where should `j.exact_details` go?
2. Easy lookups don’t need the medium model. Try `j.quick_recall`.
3. Gold takes three rows.

<details>
<summary>One Gold table (spoiler)</summary>

```js
export const TABLE = [
  { when: 'Exact letters, words or digits', test: j => j.exact_details, option: 'sonnet:high' },
  { when: 'Quick recall', test: j => j.quick_recall, option: 'haiku:low' },
  { when: 'Otherwise', test: () => true, option: 'sonnet:low' }
];
```

93.5% at $3.30, beating random (p95 92.9%). It passes the same 157 prompts as always using the medium model at high effort, for slightly less. Notice how close that is to a fixed choice: on this prompt set, most of the routing win is against the large model.

</details>

**A fair warning.** You’re tuning on the test set: you can see which prompts failed. The real eval built Router v2 from 60 separate training prompts and only then scored it on these 168. A row you can explain in one plain sentence is worth more than one extra point.

**Checkpoint.** Your table beats random routing and earns at least Bronze.

## Step 4 (bonus) · Ask Jev a new question

Router v2 got better than v1 because of better questions, not better thresholds. Write one of your own in [starter/questions.js](../starter/questions.js). A good router question is a judgment about the prompt that a smart person could make from the prompt alone, without asking what you care about. “Does a correct answer depend on exact digits?” is a judgment. “Does this need a big model?” is a decision.

```bash
npm run ask      # needs TYPESAFE_API_KEY; asks your questions about all 168 prompts
```

The answers are saved to `data/extra-answers.json`. Use them in your table as `j.<name>` (true at ≥ 0.5) or `j.p.<name>` (the probability), then score again. `npm run route -- --policy starter "…"` asks your questions live too.

**Checkpoint.** `npm run ask` prints how many prompts your question said yes to. If it’s 0 or 168, the question can’t split anything: reword it.

## After the workshop

- `npm test` checks that the repo reproduces the published numbers.
- To route your own product’s traffic: collect real prompts, grade them by code where you can, run every option you might route to, and score your router against fixed choices, perfect routing and random routing, the same way `src/score.js` does. Keep the table in a file the eval imports, so the eval scores exactly what ships.
- The live page has the interactive version, the pilot eval and Router v3: [ai.rhyslindmark.com/jev/model-router](https://ai.rhyslindmark.com/jev/model-router).
