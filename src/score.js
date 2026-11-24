// Scores every policy on the 168 held-out prompts. Free, offline, instant.
//   npm run score                              all policies
//   npm run score -- --policy starter          your table, with targets
//   npm run score -- --policy starter --misses where your table went wrong
//   npm run score -- --policy v2 --misses      same, for Judgment v2
import { loadEval, score, perfect, randomBand } from './eval.js';
import { OPTIONS, optionName, routeChoice } from './policy.js';
import { loadStarter, buildPolicies } from './levels.js';

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const val = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const { tasks, jev_model } = loadEval();
const starter = await loadStarter();
const ROUTERS = buildPolicies(starter, tasks);

const pct = x => `${(x * 100).toFixed(1)}%`;
const usd = x => `$${x.toFixed(2)}`;
const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);

function mix(picks) {
  const m = {}; for (const p of picks) m[p] = (m[p] || 0) + 1;
  return OPTIONS.filter(o => m[o]).map(o => `${o} ${m[o]}`).join(', ');
}

function misses(s) {
  const rows = tasks.map((t, i) => ({ t, pick: s.picks[i], best: perfect(t) }))
    .filter(r => !r.t.results[r.pick].pass && r.t.results[r.best].pass);
  const over = tasks.filter((t, i) => t.results[s.picks[i]].pass && t.results[s.picks[i]].cost_usd > t.results[perfect(t)].cost_usd * 1.05).length;
  console.log(`\nToo weak: ${rows.length} prompts failed where a pick that passed existed. (Overspent on ${over} more.)\n`);
  const byCat = {};
  for (const r of rows) (byCat[r.t.category] ||= []).push(r);
  for (const [cat, rs] of Object.entries(byCat)) {
    console.log(`  ${cat} (${rs.length})`);
    for (const r of rs.slice(0, 6)) {
      const flags = ['exact_details', 'long_procedure', 'quick_recall', 'writes_code'].filter(k => r.t.jev[k] >= 0.5).join(' ') || '–';
      console.log(`    ${pad(r.t.id, 15)} picked ${pad(r.pick, 12)} cheapest pass ${pad(r.best, 12)} Jev: ${flags}`);
      console.log(`      ${r.t.prompt.replace(/\s+/g, ' ').slice(0, 110)}`);
    }
    if (rs.length > 6) console.log(`    … and ${rs.length - 6} more`);
  }
}

const which = val('--policy');

console.log(`Model Router eval · ${tasks.length} held-out prompts, graded by code · Jev ${jev_model}\n`);

if (which) {
  const r = ROUTERS[which];
  if (!r) { console.error(`Unknown policy "${which}". Try: ${Object.keys(ROUTERS).join(', ')}`); process.exit(1); }
  if (!r.pick) { console.error(r.missing); process.exit(1); }
  const s = score(tasks, r.pick), band = randomBand(tasks, s.picks);
  console.log(`${r.name}\n  passed   ${pct(s.pass)}\n  cost     ${usd(s.cost)} per 1,000 prompts\n  picks    ${mix(s.picks)}`);
  console.log(`  random   ${pct(band.p95)} is the 95th percentile of the same picks dealt at random: ${s.pass > band.p95 ? 'beats random ✓' : 'does NOT beat random'}`);
  if (which === 'starter') {
    // Targets come from the data, so ties are exact (157/168 is 93.45%, shown as 93.5%).
    const choice = score(tasks, ROUTERS.choice.pick), v2 = score(tasks, ROUTERS.v2.pick), best = score(tasks, () => 'sonnet:high');
    const targets = [
      ['Bronze', `pass ≥ "Which model?" (${pct(choice.pass)}) for ≤ ${usd(choice.cost)}`, s.pass >= choice.pass && s.cost <= choice.cost],
      ['Silver', `pass > Judgment v2 (${pct(v2.pass)}) for ≤ ${usd(best.cost)}`, s.pass > v2.pass && s.cost <= best.cost],
      ['Gold', `pass ≥ always sonnet:high (${pct(best.pass)}) for < ${usd(best.cost)}`, s.pass >= best.pass && s.cost < best.cost]
    ];
    console.log('\n  Targets (each also needs "beats random"):');
    for (const [medal, what, ok] of targets) console.log(`  ${ok && s.pass > band.p95 ? '✓' : '·'} ${pad(medal, 7)} ${what}`);
  }
  if (flag('--misses')) misses(s);
  process.exit(0);
}

const rows = [];
const add = (name, pick, router) => { const s = score(tasks, pick); rows.push({ name, ...s, band: router ? randomBand(tasks, s.picks) : null }); };
add('Perfect routing (cheapest option that passed)', perfect);
for (const o of OPTIONS) add(`Always ${optionName(o)}`, () => o);
for (const [k, r] of Object.entries(ROUTERS)) if (r.pick) add(r.name, r.pick, true);
if (ROUTERS.mychoice.missing) console.log(ROUTERS.mychoice.missing + '\n');
add('"Which model should I use?" (low effort)', t => routeChoice(t.jev, 'low').option, true);
rows.sort((a, b) => b.pass - a.pass || a.cost - b.cost);
console.log(`${pad('Policy', 46)} ${lpad('Passed', 7)} ${lpad('$/1k', 7)}  Beats random?`);
for (const r of rows) console.log(`${pad(r.name, 46)} ${lpad(pct(r.pass), 7)} ${lpad(usd(r.cost), 7)}  ${r.band ? (r.pass > r.band.p95 ? `yes (p95 ${pct(r.band.p95)})` : `no (p95 ${pct(r.band.p95)})`) : ''}`);
console.log('\nYour table in detail: npm run score -- --policy starter --misses');
