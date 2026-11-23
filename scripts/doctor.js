// Checks your setup before the workshop.
//   npm run doctor
import { existsSync, readFileSync } from 'node:fs';
try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch {}
const ok = (b, msg, fix, optional) => { console.log(`${b ? '✓' : optional ? '·' : '✗'} ${msg}${!b && fix ? `\n    → ${fix}` : ''}`); return b; };
const major = Number(process.versions.node.split('.')[0]);
let good = ok(major >= 22, `Node ${process.versions.node}`, 'Install Node 22 or newer (nvm install && nvm use).');
good = ok(existsSync(new URL('../data/eval.json', import.meta.url)), 'Eval data in data/eval.json', 'Re-clone the repo.') && good;
try {
  const { tasks } = JSON.parse(readFileSync(new URL('../data/eval.json', import.meta.url), 'utf8'));
  good = ok(tasks.length === 168, `${tasks.length} held-out prompts with results`) && good;
} catch (e) { good = ok(false, `Reading eval data: ${e.message}`) && good; }
ok(!!process.env.TYPESAFE_API_KEY, 'TYPESAFE_API_KEY (optional: only for routing your own prompts live and npm run ask)', 'cp .env.example .env, then add a key from https://docs.typesafe.ai/', true);
ok(!!process.env.OPENROUTER_API_KEY, 'OPENROUTER_API_KEY (optional: only for npm run route -- --run)', 'Add one from https://openrouter.ai/keys', true);
console.log(good ? '\nReady. Start with: npm run score' : '\nFix the ✗ items above.');
process.exit(good ? 0 : 1);
