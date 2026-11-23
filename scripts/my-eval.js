// LEVEL 3 · Runs your eval (starter/my-eval.js): every prompt on every option,
// graded by your checks, then every router scored on the same runs.
// Needs TYPESAFE_API_KEY and OPENROUTER_API_KEY. Resumable: finished runs are
// saved to data/my-eval-results.json and never paid for twice.
//   npm run my-eval
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { ALL_QUESTIONS } from '../src/questions.js';
import { askJev, jevKey } from '../src/jev.js';
import { callModel } from '../src/router.js';
import { OPTIONS, optionName } from '../src/policy.js';
import { score, perfect } from '../src/eval.js';
import { loadStarter, buildPolicies } from '../src/levels.js';

const OUT = new URL('../data/my-eval-results.json', import.meta.url);
const BUDGET = Number(process.env.MY_EVAL_BUDGET_USD) || 1;
const { MY_EVAL } = await import(new URL(`../starter/my-eval.js?t=${Date.now()}`, import.meta.url));
const s = await loadStarter();
if (!process.env.OPENROUTER_API_KEY) { console.error('OPENROUTER_API_KEY is not set. See docs/KEYS.md.'); process.exit(1); }
const key = jevKey();
const saved = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const save = () => writeFileSync(OUT, JSON.stringify(saved, null, 1));
let spent = Object.values(saved).reduce((t, r) => t + Object.values(r.runs || {}).reduce((u, x) => u + (x.cost_usd || 0), 0), 0);
const questions = { ...ALL_QUESTIONS, ...s.myQuestions, ...(s.choiceIsDefault ? {} : { my_choice: s.choice }) };

console.log(`${MY_EVAL.length} prompts × ${OPTIONS.length} options. Budget $${BUDGET.toFixed(2)} (spent so far $${spent.toFixed(4)}).\n`);
for (const [n, item] of MY_EVAL.entries()) {
  const rec = (saved[item.prompt] ||= { runs: {} });
  // Jev's judgments: asked again whenever your questions change.
  const sig = JSON.stringify(questions);
  if (rec.sig !== sig) {
    rec.jev = (await askJev({ prompt: item.prompt }, questions, { key })).answers; rec.sig = sig; save();
  }
  // Every option, once. Replies are kept, so changing a check re-grades for free.
  await Promise.all(OPTIONS.map(async o => {
    if (rec.runs[o]) return;
    if (spent > BUDGET) return;
    try {
      const r = await callModel(o, item.prompt);
      const cost = r.usage?.cost ?? 0; spent += cost;
      rec.runs[o] = { text: r.text, cost_usd: cost };
    } catch (e) { console.error(`  ${o}: ${e.message}`); }
  }));
  save();
  const row = OPTIONS.map(o => rec.runs[o] ? (item.check(rec.runs[o].text) ? '✓' : '✗') : '·').join('  ');
  console.log(`${String(n + 1).padStart(2)}  ${row}   ${item.prompt.replace(/\s+/g, ' ').slice(0, 70)}`);
  if (spent > BUDGET) { console.log(`\nStopped at the $${BUDGET} budget. Raise MY_EVAL_BUDGET_USD to continue.`); break; }
}
console.log(`    ${OPTIONS.map(o => o.replace('haiku', 'S').replace('sonnet', 'M').replace('opus', 'L').replace(':low', 'lo').replace(':high', 'hi').padEnd(3)).join('')}  (S/M/L = small/medium/large model, lo/hi = effort)`);

// ---- Score every router on these runs ------------------------------------------
const tasks = MY_EVAL.map(item => saved[item.prompt]).map((rec, i) => ({ rec, item: MY_EVAL[i] }))
  .filter(({ rec }) => rec?.jev && OPTIONS.every(o => rec.runs[o]))
  .map(({ rec, item }) => ({ id: `my-${MY_EVAL.indexOf(item) + 1}`, prompt: item.prompt, jev: rec.jev,
    results: Object.fromEntries(OPTIONS.map(o => [o, { pass: item.check(rec.runs[o].text) ? 1 : 0, cost_usd: rec.runs[o].cost_usd }])) }));
if (!tasks.length) { console.log('\nNo prompt has all six runs yet.'); process.exit(0); }
const P = buildPolicies(s, tasks);
const rows = [['Perfect routing', perfect], ...OPTIONS.map(o => [`Always ${optionName(o)}`, () => o]),
  ...Object.entries(P).filter(([k, p]) => p.pick && k !== 'v3').map(([, p]) => [p.name, p.pick])];
console.log(`\nOn your ${tasks.length} prompts (cost per 1,000 prompts at these prices):\n`);
for (const [name, pick] of rows) {
  const r = score(tasks, pick);
  console.log(`  ${name.padEnd(46)} ${(r.pass * 100).toFixed(0).padStart(4)}%  $${r.cost.toFixed(2).padStart(7)}   ${r.picks.map(o => o.replace('haiku', 'S').replace('sonnet', 'M').replace('opus', 'L').replace(':low', 'lo').replace(':high', 'hi')).join(' ')}`);
}
console.log(`\nSpent $${spent.toFixed(4)} in total. Replies are in data/my-eval-results.json: read the failures before you trust a check.`);
