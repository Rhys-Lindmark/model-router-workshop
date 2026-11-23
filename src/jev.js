// A minimal Jev client: one POST, typed questions in, probabilities out.
// Docs: https://docs.typesafe.ai/
export const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
export const JEV_MODEL = 'jev-1.14.0'; // the version the eval used

try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch {}

export function jevKey() {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) throw new Error('TYPESAFE_API_KEY is not set. Copy .env.example to .env and add your key (see README).');
  return key;
}

// Returns { model, elapsed_ms, raw, answers } where `answers` is flat, the
// same shape as data/eval.json: a Score becomes { '0': p, … }, a Noul its
// probability of true, a Choice its option probabilities.
export async function askJev(state, questions, { key = jevKey(), model = JEV_MODEL } = {}) {
  const request = { model, state, questions };
  const t0 = performance.now();
  const r = await fetch(ENDPOINT, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
  if (!r.ok) throw new Error(`Jev HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const raw = await r.json();
  const answers = {};
  for (const [k, a] of Object.entries(raw.answers || {})) {
    if (typeof a?.noul === 'number') answers[k] = a.noul;
    else if (a?.probabilities) answers[k] = a.probabilities; // Score and Choice
  }
  for (const k of Object.keys(questions)) if (!(k in answers)) throw new Error(`Jev returned no answer for "${k}": ${JSON.stringify(raw).slice(0, 300)}`);
  return { model: raw.model, elapsed_ms: performance.now() - t0, request, raw, answers };
}
