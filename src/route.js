// Routes one prompt: Jev judges it, a truth table picks the model.
//   npm run route -- "Prove that there are infinitely many primes"
//   npm run route -- --policy starter "How many r's are in strawberry?"
//   npm run route -- --policy v1 "…"         the original table
//   npm run route -- --offline letters-01    replay a prompt from the eval, no key needed
//   npm run route -- --run "…"               also send the prompt to the picked model (OpenRouter)
//   npm run route -- --json "…"              print the exact Jev request and response too
import { ALL_QUESTIONS, V1_QUESTIONS, V2_QUESTIONS } from './questions.js';
import { askJev } from './jev.js';
import { DEPTH, ROUTER_V2, TIERS, optionName, route, routeV1, routeChoice, ROUTER_V1 } from './policy.js';
import { loadEval } from './eval.js';
import { callModel } from './router.js';

const args = process.argv.slice(2);
const val = f => { const i = args.indexOf(f); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = f => { const i = args.indexOf(f); if (i < 0) return false; args.splice(i, 1); return true; };
const policy = val('--policy') || 'v2', offline = val('--offline'), run = flag('--run'), json = flag('--json');
const prompt = args.join(' ').trim();

const c = { dim: s => `\x1b[2m${s}\x1b[0m`, bold: s => `\x1b[1m${s}\x1b[0m`, green: s => `\x1b[32m${s}\x1b[0m`, yellow: s => `\x1b[33m${s}\x1b[0m` };
const pad = (s, n) => String(s).padEnd(n);

let answers, meta, task;
if (offline) {
  const { tasks, jev_model } = loadEval();
  task = tasks.find(t => t.id === offline);
  if (!task) { console.error(`No eval prompt "${offline}". Some ids: ${tasks.slice(0, 8).map(t => t.id).join(', ')}`); process.exit(1); }
  answers = task.jev; meta = `${jev_model} · cached from the eval`;
} else {
  if (!prompt) { console.error('Usage: npm run route -- "your prompt"   (or --offline <eval id> without a key)'); process.exit(1); }
  let extra = {};
  if (policy === 'starter') extra = (await import('../starter/questions.js')).MY_QUESTIONS;
  const res = await askJev({ prompt }, { ...ALL_QUESTIONS, ...extra });
  answers = res.answers; meta = `${res.model} · ${Math.round(res.elapsed_ms)} ms · one request, ${Object.keys(res.request.questions).length} questions`;
  if (json) console.log(c.dim(JSON.stringify(res.request, null, 1)), '\n', c.dim(JSON.stringify(res.raw, null, 1)));
}

console.log(`\n${c.bold('Prompt')}  ${task ? task.prompt : prompt}\n`);

// ---- Jev's judgments --------------------------------------------------------
console.log(`${c.bold('Jev judges')}  ${c.dim(meta)}`);
const depth = [0, 1, 2, 3].map(i => answers.reasoning_depth[i]);
const top = depth.indexOf(Math.max(...depth));
console.log(`  score  ${pad(V1_QUESTIONS.reasoning_depth.instructions, 80)} ${DEPTH.map((d, i) => (i === top ? c.bold : c.dim)(`${d} ${depth[i].toFixed(2)}`)).join('  ')}`);
const yesAt = policy === 'v1' ? 0.3 : 0.5;
const nouls = policy === 'v1' ? Object.keys(V1_QUESTIONS).slice(1) : [...Object.keys(V2_QUESTIONS), ...Object.keys(V1_QUESTIONS).slice(1)];
for (const k of [...nouls, ...Object.keys(answers).filter(k => typeof answers[k] === 'number' && !nouls.includes(k))]) {
  const p = answers[k], q = ALL_QUESTIONS[k]?.instructions || k;
  console.log(`  noul   ${pad(q.length > 80 ? q.slice(0, 77) + '…' : q, 80)} ${p.toFixed(2)}  ${p > yesAt ? c.green('yes') : c.dim('no')}`);
}

// ---- The truth table ----------------------------------------------------------
let picked;
if (policy === 'v1') {
  const r = routeV1(answers); picked = r.option;
  table('Router v1 (src/policy.js)', ROUTER_V1.map(x => ({ when: x.when, option: `${x.tier}:…` })), r.row);
  console.log(c.dim('  Effort: high when depth is "plan" or "long", or depth is "few steps" with high stakes.'));
} else {
  const t = policy === 'starter' ? (await import('../starter/policy.js')).TABLE : ROUTER_V2;
  const r = route(t, answers); picked = r.option;
  table(policy === 'starter' ? 'Your table (starter/policy.js)' : 'Router v2 (src/policy.js)', t, r.row);
}
function table(title, rows, hit) {
  console.log(`\n${c.bold('Code decides')}  ${c.dim(`${title} · first match wins`)}`);
  rows.forEach((r, i) => {
    const line = `${String(i + 1).padStart(3)}  ${pad(r.when || '(row ' + (i + 1) + ')', 46)} ${pad(r.option, 12)}`;
    console.log(i === hit ? c.green(`${line} ← match`) : i < hit ? c.dim(`${line} no`) : c.dim(line));
  });
}

const choice = routeChoice(answers);
console.log(`\n${c.bold('Route')}   ${c.green(optionName(picked))}  ${c.dim(`(${picked})`)}`);
console.log(c.dim(`Compare  "Which model should I use?" → ${choice.choice} (${Math.round(answers.model_choice[choice.choice] * 100)}%), and no reason why.`));
if (task) {
  const r = task.results[picked];
  console.log(c.dim(`In the eval, ${picked} ${r.pass ? 'passed' : 'FAILED'} this prompt for $${r.cost_usd.toFixed(6)}.`));
}

// ---- Optional: actually call the model ----------------------------------------
if (run) {
  const [tier, effort] = picked.split(':');
  console.log(c.dim(`\nCalling ${TIERS[tier].openrouter} with reasoning effort ${effort}…`));
  try {
    const d = await callModel(picked, task ? task.prompt : prompt);
    console.log(`\n${d.text || '(no reply)'}\n`);
    if (d.usage) console.log(c.dim(`${d.usage.prompt_tokens} in · ${d.usage.completion_tokens} out${d.usage.cost != null ? ` · $${d.usage.cost.toFixed(6)}` : ''}`));
  } catch (e) { console.error(`\n${e.message}`); process.exit(1); }
}
