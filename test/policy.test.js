// The repo's numbers must match the published eval.
//   npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEval, score, perfect } from '../src/eval.js';
import { ROUTER_V2, route, routeV1, routeChoice, OPTIONS } from '../src/policy.js';
import { TABLE } from '../starter/policy.js';

const { tasks } = loadEval();
const r1 = x => Math.round(x * 1000) / 10;

test('168 held-out prompts, each with a result for every option', () => {
  assert.equal(tasks.length, 168);
  for (const t of tasks) for (const o of OPTIONS) assert.ok(t.results[o] && typeof t.results[o].pass === 'number', `${t.id} ${o}`);
});

test('Router v2 reproduces the page: 91.1% at $3.20 per 1,000', () => {
  const s = score(tasks, t => route(ROUTER_V2, t.jev).option);
  assert.equal(r1(s.pass), 91.1); assert.equal(s.cost.toFixed(2), '3.20');
});

test('Router v1 reproduces the page: 80.4% at $2.76', () => {
  const s = score(tasks, t => routeV1(t.jev).option);
  assert.equal(r1(s.pass), 80.4); assert.equal(s.cost.toFixed(2), '2.76');
});

test('"Which model should I use?" at high effort: 85.7%', () => {
  assert.equal(r1(score(tasks, t => routeChoice(t.jev, 'high').option).pass), 85.7);
});

test('Perfect routing: 97.0% at $1.70', () => {
  const s = score(tasks, perfect);
  assert.equal(r1(s.pass), 97.0); assert.equal(s.cost.toFixed(2), '1.70');
});

test('Every table ends in a row that always matches', () => {
  for (const t of [ROUTER_V2, TABLE]) assert.equal(t.at(-1).test({}), true);
});

test('Starter eval checks accept right replies and reject wrong ones', async () => {
  const { MY_EVAL } = await import('../starter/my-eval.js');
  const right = ['Brasília', '582,552', '3948725172', 'Sunday', '63', 'Wild wind and rain fall. Thick clouds rush past, dark and loud; a storm is coming upon our town. All of us hurry, shutting doors as lightning cracks and booms roll on and on. Trains stop, birds go mum, and dogs hunt for a dry spot to stay still until it is past.'];
  const wrong = ['Rio de Janeiro', '582,553', '3948725171', 'Monday', '1963', 'The storm rolled in.'];
  MY_EVAL.forEach((e, i) => { assert.equal(e.check(`Working...\n${right[i]}`), true, `right ${i}`); assert.equal(e.check(`Working...\n${wrong[i]}`), false, `wrong ${i}`); });
});
