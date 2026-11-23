// Your model router, end to end: type a prompt, Jev judges it, your table
// picks a model, and that model answers. Needs both keys (docs/KEYS.md).
//   npm run chat                  uses your table (starter/policy.js)
//   npm run chat -- --policy v2   uses Router v2
import { createInterface } from 'node:readline/promises';
import { loadPolicy, routePrompt, callModel } from '../src/router.js';
import { optionName } from '../src/policy.js';

const i = process.argv.indexOf('--policy');
const policy = await loadPolicy(i > 0 ? process.argv[i + 1] : 'starter');
const dim = s => `\x1b[2m${s}\x1b[0m`, green = s => `\x1b[32m${s}\x1b[0m`;
const yes = j => Object.keys(j).filter(k => j[k] === true).join(', ') || 'none';
console.log(`Model router · ${policy.name} · empty line to quit\n`);
const rl = createInterface({ input: process.stdin, output: process.stdout });
let spent = 0;
while (true) {
  const prompt = (await rl.question('> ')).trim();
  if (!prompt) break;
  try {
    const r = await routePrompt(prompt, policy);
    console.log(dim(`  Jev said yes to: ${yes(r.j)} · row ${r.row + 1} “${r.when}”`));
    console.log(`  → ${green(optionName(r.option))}`);
    const reply = await callModel(r.option, prompt);
    const cost = reply.usage?.cost ?? 0; spent += cost;
    console.log(`\n${reply.text.trim()}\n`);
    console.log(dim(`  ${reply.model}${reply.usage ? ` · ${reply.usage.completion_tokens} tokens out · $${cost.toFixed(6)} · $${spent.toFixed(6)} this session` : ''}\n`));
  } catch (e) { console.error(`  ${e.message}\n`); }
}
rl.close();
