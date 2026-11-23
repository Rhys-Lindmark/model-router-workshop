// Scores routing policies on the Model Router eval's 168 held-out prompts.
// Every prompt was already run on every option and graded by code, so scoring
// a policy is free and instant: look up how its pick did.
import { existsSync, readFileSync } from 'node:fs';
import { OPTIONS } from './policy.js';

const DATA = new URL('../data/eval.json', import.meta.url);
const EXTRA = new URL('../data/extra-answers.json', import.meta.url);

export function loadEval() {
  const data = JSON.parse(readFileSync(DATA, 'utf8'));
  // Answers to your own questions (npm run ask), merged in by prompt id.
  const extra = existsSync(EXTRA) ? JSON.parse(readFileSync(EXTRA, 'utf8')) : {};
  for (const t of data.tasks) Object.assign(t.jev, extra[t.id] || {});
  return data;
}

const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;

// pick: task -> option. Returns pass rate, $ per 1,000 prompts and the picks.
export function score(tasks, pick) {
  const picks = tasks.map(pick);
  for (const o of picks) if (!OPTIONS.includes(o)) throw new Error(`Unknown option "${o}". Use one of: ${OPTIONS.join(', ')}`);
  return {
    pass: mean(tasks.map((t, i) => t.results[picks[i]].pass)),
    cost: 1000 * mean(tasks.map((t, i) => t.results[picks[i]].cost_usd)),
    picks
  };
}

// Perfect routing: the cheapest option that passed (or the cheapest, if none did).
export const perfect = t => {
  const ok = OPTIONS.filter(o => t.results[o].pass);
  return (ok.length ? ok : OPTIONS).sort((a, b) => t.results[a].cost_usd - t.results[b].cost_usd)[0];
};

// Random routing: keep a policy's mix of picks but deal them to prompts at
// random. A router "beats random" if it scores above the 95th percentile.
// Seeded, so the numbers are the same on every machine.
export function randomBand(tasks, picks, n = 10000, seed = 1) {
  let s = seed >>> 0;
  const rand = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const xs = [];
  for (let k = 0; k < n; k++) {
    const a = [...picks];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    xs.push(mean(tasks.map((t, i) => t.results[a[i]].pass)));
  }
  xs.sort((x, y) => x - y);
  return { p50: xs[Math.floor(n * 0.5)], p95: xs[Math.floor(n * 0.95)] };
}
