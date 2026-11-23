// Asks Jev your questions (starter/questions.js) about all 168 eval prompts
// and saves the answers to data/extra-answers.json, where `npm run score` and
// your table can use them. Needs TYPESAFE_API_KEY. Resumable.
//   npm run ask
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { MY_QUESTIONS } from '../starter/questions.js';
import { askJev, jevKey } from '../src/jev.js';

const OUT = new URL('../data/extra-answers.json', import.meta.url);
const names = Object.keys(MY_QUESTIONS);
if (!names.length) { console.error('Add at least one question to starter/questions.js first.'); process.exit(1); }
const key = jevKey();
const { tasks } = JSON.parse(readFileSync(new URL('../data/eval.json', import.meta.url), 'utf8'));
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const todo = tasks.filter(t => names.some(n => out[t.id]?.[n] == null));
console.log(`Asking ${names.join(', ')} about ${todo.length} prompts…`);
let i = 0, done = 0, failed = 0;
async function worker() {
  while (i < todo.length) {
    const t = todo[i++];
    try {
      const { answers } = await askJev({ prompt: t.prompt }, MY_QUESTIONS, { key });
      out[t.id] = { ...out[t.id], ...answers };
      if (++done % 20 === 0) { writeFileSync(OUT, JSON.stringify(out, null, 1)); process.stdout.write(`${done} `); }
    } catch (e) { failed++; console.error(`\n${t.id}: ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`\nSaved ${Object.keys(out).length} prompts to data/extra-answers.json${failed ? ` (${failed} failed: run again to retry)` : ''}.`);
for (const n of names) {
  const ps = tasks.map(t => out[t.id]?.[n]).filter(p => typeof p === 'number');
  console.log(`  ${n}: yes on ${ps.filter(p => p >= 0.5).length} of ${ps.length} prompts`);
}
console.log('Use it in starter/policy.js as j.' + names[0] + ', then: npm run score -- --policy starter');
