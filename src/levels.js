// Loads the attendee's files in starter/ fresh on every call, so edits show up
// on the next refresh of the app or the next `npm run score`.
import { CHOICE_QUESTION } from './questions.js';

const fresh = f => import(new URL(`../starter/${f}?t=${Date.now()}`, import.meta.url));

export async function loadStarter() {
  const [{ CHOICE, EFFORT = 'high' }, { MY_QUESTIONS = {} }, { TABLE }] = await Promise.all([fresh('choice.js'), fresh('questions.js'), fresh('policy.js')]);
  return { choice: CHOICE, effort: EFFORT, myQuestions: MY_QUESTIONS, table: TABLE, choiceIsDefault: isDefaultChoice(CHOICE) };
}

// The eval has Jev's answers to my Choice question. If yours words it the same
// way (option names in any case), those answers are yours too.
export function isDefaultChoice(c) {
  const d = CHOICE_QUESTION.model_choice, norm = o => JSON.stringify(Object.entries(o).map(([k, v]) => [k.toLowerCase(), v]).sort());
  return c.type === 'choice' && c.instructions === d.instructions && norm(c.criteria) === norm(d.criteria);
}

const TIER = { haiku: 'haiku', sonnet: 'sonnet', opus: 'opus', fable: 'opus' };
// Top option of a Choice → an option like 'opus:high'. Returns null for an unknown key.
export function choiceOption(probs, effort = 'high') {
  if (!probs) return null;
  const top = Object.keys(probs).reduce((b, k) => probs[k] > probs[b] ? k : b);
  const tier = TIER[top.toLowerCase()];
  return tier ? { top, option: `${tier}:${effort}` } : { top, option: null };
}

// Your Choice's answers for an eval prompt: the cached ones if your wording is
// mine, otherwise the ones `npm run ask` saved as `my_choice`.
export const myChoiceAnswers = (task, s) => s.choiceIsDefault ? task.jev.model_choice : task.jev.my_choice;

// Every policy the app and `npm run score` know, as { name, pick: task -> option }.
// `pick` is null when a policy can't be scored yet; `missing` says why.
import { ROUTER_V2, route, routeV1, routeChoice } from './policy.js';
export function buildPolicies(s, tasks) {
  const P = {
    choice: { name: '"Which model should I use?" (high effort)', pick: t => routeChoice(t.jev, 'high').option },
    mychoice: { name: 'Your Choice (starter/choice.js)', pick: null, missing: null },
    v1: { name: 'Judgment v1: the original table', pick: t => routeV1(t.jev).option },
    v2: { name: 'Judgment v2: Jev judgments + table', pick: t => route(ROUTER_V2, t.jev).option },
    v3: { name: 'Judgment v3: Jev judgments + learned odds', pick: t => t.router_v3_pick },
    starter: { name: 'Your table (starter/policy.js)', pick: t => route(s.table, t.jev).option }
  };
  if (!s.choiceIsDefault) {
    const bad = Object.keys(s.choice.criteria).filter(k => !choiceOption({ [k]: 1 }).option);
    if (bad.length) P.mychoice.missing = `Your Choice has options that aren't tiers (${bad.join(', ')}). Use haiku, sonnet, opus or fable as option keys.`;
    else if (tasks.some(t => !t.jev.my_choice)) P.mychoice.missing = 'Your Choice wording differs from mine, so it has no answers yet: run `npm run ask` (needs a Jev key) to score it.';
    else P.mychoice.pick = t => choiceOption(t.jev.my_choice, s.effort).option;
  }
  return P;
}
