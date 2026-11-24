// The whole router as two functions you can drop into an app:
//   const r = await routePrompt('Count the r’s in strawberry');   // Jev judges, your table decides
//   const reply = await callModel(r.option, prompt);              // the picked model answers
import { ALL_QUESTIONS } from './questions.js';
import { askJev } from './jev.js';
import { ROUTER_V2, TIERS, route } from './policy.js';

// Load the table and any extra questions: 'starter' (yours) or 'v2' (the reference).
export async function loadPolicy(name = 'starter') {
  if (name === 'v2') return { table: ROUTER_V2, questions: ALL_QUESTIONS, name: 'Judgment v2 (src/policy.js)' };
  const [{ TABLE }, { MY_QUESTIONS }] = await Promise.all([import('../starter/policy.js'), import('../starter/questions.js')]);
  return { table: TABLE, questions: { ...ALL_QUESTIONS, ...MY_QUESTIONS }, name: 'Your table (starter/policy.js)' };
}

export async function routePrompt(prompt, policy) {
  policy ||= await loadPolicy();
  const jev = await askJev({ prompt }, policy.questions);
  const r = route(policy.table, jev.answers);
  return { ...r, when: policy.table[r.row].when, model: TIERS[r.option.split(':')[0]].openrouter, jev };
}

// Sends the prompt to the picked model through OpenRouter.
export async function callModel(option, prompt, { key = process.env.OPENROUTER_API_KEY } = {}) {
  if (!key) throw new Error('OPENROUTER_API_KEY is not set. Add it to .env (see docs/KEYS.md).');
  const [tier, effort] = option.split(':');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: TIERS[tier].openrouter, messages: [{ role: 'user', content: prompt }], reasoning: { effort }, max_tokens: effort === 'high' ? 8000 : 2000, usage: { include: true } })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`OpenRouter HTTP ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return { text: d.choices?.[0]?.message?.content ?? '', usage: d.usage ?? null, model: TIERS[tier].openrouter };
}
