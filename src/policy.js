// Routing policy: Jev's answers in, a model tier and a reasoning effort out.
// Jev judges; this code decides. Everything a person would audit is here.
//
// An "option" is `tier:effort`, e.g. `sonnet:high`. The tier names match the
// live page's truth tables. In the eval, open models from one family played
// each tier (see TIERS), so tier gaps weren't swamped by family quirks.
export const TIERS = {
  haiku:  { name: 'Qwen 3.7 Flash', openrouter: 'qwen/qwen3.7-flash', size: 'small' },
  sonnet: { name: 'Qwen 3.7 Plus',  openrouter: 'qwen/qwen3.7-plus',  size: 'medium' },
  opus:   { name: 'Qwen 3.7 Max',   openrouter: 'qwen/qwen3.7-max',   size: 'large' }
};
export const OPTIONS = ['haiku:low', 'haiku:high', 'sonnet:low', 'sonnet:high', 'opus:low', 'opus:high'];
export const optionName = o => { const [t, e] = o.split(':'); return `${TIERS[t].name} · ${e} effort`; };

// ---- Reading Jev's answers ---------------------------------------------------
// `answers` is flat: { reasoning_depth: { '0': p, …, '3': p }, expertise: p, … }.
// The Score's weighted mean can sit between two peaks, so read the most likely
// level instead (ties go to the higher level).
export const DEPTH = ['none', 'few steps', 'plan', 'long'];
export const depthOf = answers => [0, 1, 2, 3].reduce((b, i) => answers.reasoning_depth[i] >= answers.reasoning_depth[b] ? i : b, 0);

// Turns probabilities into the yes/no judgments a truth table tests.
// `yes` is the threshold; v2 reads ≥ 0.5 as yes.
export function judgments(answers, { yes = 0.5 } = {}) {
  const j = { depth: depthOf(answers), p: answers };
  for (const [k, v] of Object.entries(answers)) if (typeof v === 'number') j[k] = v >= yes;
  return j;
}

// ---- Judgment v2: the table built from the eval ---------------------------------
// Rows were set from 60 training prompts only (never the 168 test prompts).
// Ordered; first match wins; the last row always matches.
export const ROUTER_V2 = [
  { when: 'Exact details and a long procedure',          test: j => j.exact_details && j.long_procedure,               option: 'sonnet:high' },
  { when: 'Exact details, quick recall or no reasoning', test: j => j.exact_details && (j.quick_recall || j.depth === 0), option: 'haiku:high' },
  { when: 'Exact letters, words or digits',              test: j => j.exact_details,                                   option: 'sonnet:high' },
  { when: 'Long step-by-step procedure',                 test: j => j.long_procedure,                                  option: 'sonnet:high' },
  { when: 'Large piece of work',                         test: j => j.large_output,                                    option: 'opus:low' },
  { when: 'Writes code',                                 test: j => j.writes_code,                                     option: 'haiku:high' },
  { when: 'Quick recall',                                test: j => j.quick_recall,                                    option: 'haiku:low' },
  { when: 'Otherwise',                                   test: () => true,                                             option: 'sonnet:low' }
];

// ---- Judgment v1: the table that shipped first ----------------------------------
// Two tables: reasoning effort from (depth, stakes), tier from ordered rules.
// Noul thresholds: yes ≥ 0.7, no ≤ 0.3, and "unsure" in between counts as yes.
const v1Yes = p => p > 0.3;
const V1_TIER_RULES = [
  { when: 'Large piece of work',         test: j => j.large_output,                tier: 'opus' }, // Fable on the page; no Fable tier in the eval
  { when: 'Depth is long',               test: j => j.depth === 3,                 tier: 'opus' }, // Fable on the page
  { when: 'Expertise and depth is plan', test: j => j.expertise && j.depth >= 2,   tier: 'opus' },
  { when: 'Expertise and high stakes',   test: j => j.expertise && j.high_stakes,  tier: 'opus' },
  { when: 'Expertise',                   test: j => j.expertise,                   tier: 'sonnet' },
  { when: 'Depth is plan',               test: j => j.depth === 2,                 tier: 'sonnet' },
  { when: 'Nuanced writing',             test: j => j.nuanced_writing,             tier: 'sonnet' },
  { when: 'High stakes',                 test: j => j.high_stakes,                 tier: 'sonnet' },
  { when: 'Otherwise',                   test: () => true,                         tier: 'haiku' }
];
// Reasoning level 0-3 (Off, Low, Medium, High); Medium and up run at high effort.
const v1Level = j => j.depth === 3 ? 3 : j.depth + (j.high_stakes ? 1 : 0);
export const ROUTER_V1 = V1_TIER_RULES.map(r => ({ ...r }));
export function routeV1(answers) {
  const p = answers, j = { depth: depthOf(p), p };
  for (const k of ['expertise', 'high_stakes', 'large_output', 'nuanced_writing']) j[k] = v1Yes(p[k]);
  const row = V1_TIER_RULES.findIndex(r => r.test(j));
  return { row, option: `${V1_TIER_RULES[row].tier}:${v1Level(j) >= 2 ? 'high' : 'low'}`, j };
}

// ---- The anti-pattern: "Which model should I use?" ----------------------------
// Take the top answer. There is nothing else to read or change.
const CHOICE_TIER = { Haiku: 'haiku', Sonnet: 'sonnet', Opus: 'opus', Fable: 'opus' };
export function routeChoice(answers, effort = 'high') {
  const c = answers.model_choice, top = Object.keys(c).reduce((b, k) => c[k] > c[b] ? k : b);
  return { choice: top, option: `${CHOICE_TIER[top]}:${effort}` };
}

// ---- Any first-match table ------------------------------------------------------
export function route(table, answers, opts) {
  const j = judgments(answers, opts), row = table.findIndex(r => r.test(j));
  if (row < 0) throw new Error('No row matched. End your table with { when: \'Otherwise\', test: () => true, option: … }.');
  return { row, option: table[row].option, j };
}
