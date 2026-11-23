// Asks Jev your questions about all 168 eval prompts and saves the answers to
// data/extra-answers.json, where `npm run score` and the app use them:
//   - every question in starter/questions.js (LEVEL 2)
//   - your Choice in starter/choice.js, if you changed its wording (LEVEL 1)
// Needs TYPESAFE_API_KEY. Resumable. Well under a cent per question.
//   npm run ask
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { askJev, jevKey } from '../src/jev.js';
import { loadStarter } from '../src/levels.js';

const OUT = new URL('../data/extra-answers.json', import.meta.url);
const s = await loadStarter();
const questions = { ...s.myQuestions, ...(s.choiceIsDefault ? {} : { my_choice: s.choice }) };
const names = Object.keys(questions);
if (!names.length) { console.error('Nothing to ask: add a question to starter/questions.js, or change the wording in starter/choice.js.'); process.exit(1); }
const key = jevKey();
const { tasks } = JSON.parse(readFileSync(new URL('../data/eval.json', import.meta.url), 'utf8'));
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
// A changed question needs fresh answers: remember the wording each answer came from.
const sig = q => JSON.stringify(q);
out._questions ||= {};
for (const n of names) if (out._questions[n] !== sig(questions[n])) { for (const t of tasks) if (out[t.id]) delete out[t.id][n]; out._questions[n] = sig(questions[n]); }
const todo = tasks.filter(t => names.some(n => out[t.id]?.[n] == null));
console.log(`Asking ${names.join(', ')} about ${todo.length} prompts…`);
let i = 0, done = 0, failed = 0;
async function worker() {
  while (i < todo.length) {
    const t = todo[i++];
    try {
      const { answers } = await askJev({ prompt: t.prompt }, questions, { key });
      out[t.id] = { ...out[t.id], ...answers };
      if (++done % 20 === 0) { writeFileSync(OUT, JSON.stringify(out, null, 1)); process.stdout.write(`${done} `); }
    } catch (e) { failed++; console.error(`\n${t.id}: ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`\nSaved answers for ${tasks.filter(t => out[t.id]).length} prompts to data/extra-answers.json${failed ? ` (${failed} failed: run again to retry)` : ''}.`);
for (const n of names.filter(n => n !== 'my_choice')) {
  const ps = tasks.map(t => out[t.id]?.[n]).filter(p => typeof p === 'number');
  console.log(`  ${n}: yes on ${ps.filter(p => p >= 0.5).length} of ${ps.length} prompts${ps.length && (ps.every(p => p >= 0.5) || ps.every(p => p < 0.5)) ? '  ← splits nothing: reword it' : ''}`);
}
if (names.includes('my_choice')) console.log('  my_choice: saved. npm run score now includes "Your Choice".');
console.log('Next: npm run score -- --policy starter   (use a question as j.<name> in starter/policy.js)');
