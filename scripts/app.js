// Your local Model Router page: http://localhost:3401
// Click a prompt (no key needed: Jev's answers are saved from the eval) or type
// your own (needs TYPESAFE_API_KEY). Reads your files in starter/ on every
// request, so edit them and refresh.
//   npm run app
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { ALL_QUESTIONS } from '../src/questions.js';
import { askJev, JEV_MODEL } from '../src/jev.js';
import { DEPTH, OPTIONS, ROUTER_V2, optionName, route, routeChoice, judgments } from '../src/policy.js';
import { loadEval, score, perfect, randomBand } from '../src/eval.js';
import { loadStarter, buildPolicies, choiceOption } from '../src/levels.js';
import { callModel } from '../src/router.js';

const PORT = Number(process.env.PORT) || 3401;
const CHIPS = ['genfacts-03', 'multiply-09', 'multiply-13', 'calendar-11', 'calendar-15', 'lipogram-05', 'acrostic-03', 'letters-01', 'knights-05', 'shortwords-03'];
const keys = () => ({ jev: !!process.env.TYPESAFE_API_KEY, openrouter: !!process.env.OPENROUTER_API_KEY });
const send = (res, code, body, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(type === 'application/json' ? JSON.stringify(body) : body); };
const body = req => new Promise((ok, bad) => { let s = ''; req.on('data', c => { s += c; if (s.length > 20000) bad(new Error('too big')); }); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch (e) { bad(e); } }); });
const rows = table => table.map(r => ({ when: r.when, option: r.option }));
const questionList = (qs, mine = {}) => Object.entries(qs).map(([id, q]) => ({ id, type: q.type, instructions: q.instructions, mine: id in mine }));

async function state() {
  const s = await loadStarter(), { tasks } = loadEval();
  return {
    keys: keys(), jev_model: JEV_MODEL,
    chips: CHIPS.map(id => tasks.find(t => t.id === id)).filter(Boolean).map(t => ({ id: t.id, prompt: t.prompt, category: t.category, difficulty: t.difficulty })),
    level1: { question: s.choice, effort: s.effort, isDefault: s.choiceIsDefault },
    level2: { questions: questionList({ ...withoutChoice(ALL_QUESTIONS), ...s.myQuestions }, s.myQuestions), table: rows(s.table), v2: rows(ROUTER_V2) },
    options: Object.fromEntries(OPTIONS.map(o => [o, optionName(o)]))
  };
}
const withoutChoice = qs => Object.fromEntries(Object.entries(qs).filter(([k]) => k !== 'model_choice'));

async function routeIt({ level, id, prompt }) {
  const s = await loadStarter();
  let task = null, answers, live = false, request;
  const questions = level === 1 ? { model_choice: s.choice } : { ...withoutChoice(ALL_QUESTIONS), ...s.myQuestions };
  if (id) {
    task = loadEval().tasks.find(t => t.id === id);
    if (!task) throw new Error(`No eval prompt ${id}`);
    prompt = task.prompt;
    answers = { ...task.jev };
    if (level === 1) {
      const c = s.choiceIsDefault ? task.jev.model_choice : task.jev.my_choice;
      if (!c) return { needs: 'Your Choice wording differs from mine, so there are no saved answers for it. Type the prompt instead (needs a Jev key), or run npm run ask.' };
      answers = { model_choice: c };
    }
    const missing = level === 2 ? Object.keys(s.myQuestions).filter(k => answers[k] == null) : [];
    if (missing.length) return { needs: `No saved answers for your question${missing.length > 1 ? 's' : ''} ${missing.join(', ')}. Run npm run ask, or type the prompt (needs a Jev key).` };
  } else {
    if (!prompt?.trim()) throw new Error('Type a prompt.');
    if (!keys().jev) return { needs: 'Routing your own prompt needs a Jev key in .env (see docs/KEYS.md). The prompts above work without one.' };
    const r = await askJev({ prompt }, questions); answers = r.answers; live = { model: r.model, ms: Math.round(r.elapsed_ms) }; request = r.request;
  }
  request ||= { model: JEV_MODEL, state: { prompt }, questions };
  const result = { prompt, live, request, eval: task ? Object.fromEntries(OPTIONS.map(o => [o, task.results[o]])) : null };
  if (level === 1) {
    const c = choiceOption(answers.model_choice, s.effort);
    return { ...result, probabilities: answers.model_choice, top: c.top, option: c.option };
  }
  const j = judgments(answers), r = route(s.table, answers);
  const trace = [{ id: 'reasoning_depth', type: 'score', instructions: ALL_QUESTIONS.reasoning_depth.instructions, levels: DEPTH.map((d, i) => [d, answers.reasoning_depth[i]]), read: DEPTH[j.depth] }];
  for (const [k, q] of Object.entries(questions)) if (q.type === 'noul') trace.push({ id: k, type: 'noul', instructions: q.instructions, p: answers[k], read: answers[k] >= 0.5 ? 'yes' : 'no', mine: k in s.myQuestions });
  return { ...result, trace, row: r.row, option: r.option, compare: { v2: route(ROUTER_V2, answers).option, choice: answers.model_choice ? routeChoice(answers).option : null } };
}

async function evalView() {
  const s = await loadStarter(), { tasks } = loadEval(), P = buildPolicies(s, tasks);
  const out = [];
  const add = (key, name, pick, kind) => { const r = score(tasks, pick); const b = kind === 'router' ? randomBand(tasks, r.picks, 3000) : null; out.push({ key, name, kind, pass: r.pass, cost: r.cost, p95: b?.p95 ?? null, beats: b ? r.pass > b.p95 : null }); return r; };
  add('perfect', 'Perfect routing (cheapest option that passed)', perfect, 'fixed');
  for (const o of OPTIONS) add(o, `Always ${optionName(o)}`, () => o, 'fixed');
  let mine = null;
  for (const [k, p] of Object.entries(P)) if (p.pick) { const r = add(k, p.name, p.pick, 'router'); if (k === 'starter') mine = r; }
  const misses = tasks.map((t, i) => ({ t, pick: mine.picks[i], best: perfect(t) })).filter(x => !x.t.results[x.pick].pass && x.t.results[x.best].pass)
    .map(x => ({ id: x.t.id, category: x.t.category, prompt: x.t.prompt, pick: x.pick, best: x.best, yes: Object.keys(x.t.jev).filter(k => typeof x.t.jev[k] === 'number' && x.t.jev[k] >= 0.5) }));
  return { n: tasks.length, rows: out.sort((a, b) => b.pass - a.pass || a.cost - b.cost), misses, notes: [P.mychoice.missing].filter(Boolean) };
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch {}
    if (url.pathname === '/') return send(res, 200, await readFile(new URL('../app/index.html', import.meta.url)), 'text/html; charset=utf-8');
    if (url.pathname === '/api/state') return send(res, 200, await state());
    if (url.pathname === '/api/route' && req.method === 'POST') return send(res, 200, await routeIt(await body(req)));
    if (url.pathname === '/api/eval') return send(res, 200, await evalView());
    if (url.pathname === '/api/answer' && req.method === 'POST') {
      const { prompt, option } = await body(req);
      if (!keys().openrouter) return send(res, 200, { needs: 'Answering needs an OpenRouter key in .env (see docs/KEYS.md).' });
      if (!OPTIONS.includes(option)) throw new Error('Unknown option');
      return send(res, 200, await callModel(option, prompt));
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) { send(res, 500, { error: e.message }); }
}).listen(PORT, () => console.log(`Your Model Router: http://localhost:${PORT}\nEdit starter/choice.js, starter/questions.js and starter/policy.js, then refresh.`));
