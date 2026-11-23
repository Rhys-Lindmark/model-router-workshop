// Checks your setup.
//   npm run doctor            offline checks
//   npm run doctor -- --live  also checks that your keys work (one tiny Jev call, about $0.00001)
import { existsSync, readFileSync } from 'node:fs';
try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch {}
const live = process.argv.includes('--live');
const ok = (b, msg, fix, optional) => { console.log(`${b ? '✓' : optional ? '·' : '✗'} ${msg}${!b && fix ? `\n    → ${fix}` : ''}`); return b; };
const major = Number(process.versions.node.split('.')[0]);
let good = ok(major >= 22, `Node ${process.versions.node}`, 'Install Node 22 or newer (nvm install && nvm use).');
good = ok(existsSync(new URL('../data/eval.json', import.meta.url)), 'Eval data in data/eval.json', 'Re-clone the repo.') && good;
try {
  const { tasks } = JSON.parse(readFileSync(new URL('../data/eval.json', import.meta.url), 'utf8'));
  good = ok(tasks.length === 168, `${tasks.length} held-out prompts with results`) && good;
} catch (e) { good = ok(false, `Reading eval data: ${e.message}`) && good; }

const jevKey = process.env.TYPESAFE_API_KEY, orKey = process.env.OPENROUTER_API_KEY;
ok(!!jevKey, 'TYPESAFE_API_KEY in .env (for routing your own prompts, npm run ask, npm run chat)', 'See docs/KEYS.md', true);
ok(!!orKey, 'OPENROUTER_API_KEY in .env (for npm run chat and route --run)', 'See docs/KEYS.md', true);

if (live) {
  if (jevKey) {
    try {
      const r = await fetch('https://api.typesafe.ai/v1/systemone', { method: 'POST', headers: { Authorization: `Bearer ${jevKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'jev-1.14.0', state: { prompt: 'What is the capital of France?' }, questions: { quick_recall: { type: 'noul', instructions: 'Can `prompt` be answered by recalling one well-known fact?' } } }) });
      const d = await r.json().catch(() => ({}));
      ok(r.ok && typeof d.answers?.quick_recall?.noul === 'number', r.ok ? `Jev answers (quick_recall for "capital of France" = ${d.answers?.quick_recall?.noul})` : `Jev key rejected: HTTP ${r.status}`, r.status === 401 ? 'Check the key in .env (no quotes, no spaces). See docs/KEYS.md.' : 'See docs/KEYS.md');
    } catch (e) { ok(false, `Reaching Jev: ${e.message}`); }
  }
  if (orKey) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/key', { headers: { Authorization: `Bearer ${orKey}` } });
      const d = await r.json().catch(() => ({}));
      ok(r.ok, r.ok ? `OpenRouter key works${d.data?.limit_remaining != null ? ` ($${Number(d.data.limit_remaining).toFixed(2)} left on its limit)` : ''}` : `OpenRouter key rejected: HTTP ${r.status}`, 'Check the key in .env. See docs/KEYS.md.');
    } catch (e) { ok(false, `Reaching OpenRouter: ${e.message}`); }
  }
}
console.log(good ? `\nReady. Start with: npm run app${live ? '' : '   (npm run doctor -- --live checks your keys)'}` : '\nFix the ✗ items above.');
process.exit(good ? 0 : 1);
