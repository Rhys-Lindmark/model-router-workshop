// LEVEL 3 · Your own eval.
//
// How do you know your router is right? Run every option on prompts you can
// grade, then see what each router would have picked. That's all an eval is.
//
//   npm run my-eval      runs each prompt on all 6 options through OpenRouter, asks
//                        Jev your questions, grades every reply, and scores your
//                        Choice, your table, Router v2 and every fixed option.
//                        Needs both keys. Capped at $1 (MY_EVAL_BUDGET_USD).
//
// Replace these with prompts from YOUR project: the things your users actually
// ask. Ten good ones teach you more than a hundred generic ones. Every prompt
// needs a check: code that says whether a reply is right. Helpers below.

// ---- Checks ------------------------------------------------------------------
const lastLine = text => text.trim().split('\n').filter(Boolean).at(-1) ?? '';
// The reply's last line contains exactly this number (commas ignored), e.g. 63 but not 1963.
export const number = n => text => (lastLine(text).match(/\d[\d,]*/g) || []).map(x => x.replace(/,/g, '')).includes(String(n));
// The reply's last line contains this word or phrase (case ignored).
export const says = w => text => lastLine(text).toLowerCase().includes(String(w).toLowerCase());
// The reply never uses this letter.
export const without = letter => text => !text.toLowerCase().includes(letter.toLowerCase());
// The reply has at least this many words.
export const atLeastWords = n => text => text.trim().split(/\s+/).length >= n;
// All of the checks pass.
export const all = (...checks) => text => checks.every(c => c(text));

const LAST = ' Put only the final answer on the last line.';

// ---- Your prompts ---------------------------------------------------------------
export const MY_EVAL = [
  { prompt: 'What is the capital of Brazil?' + LAST, check: text => /bras[ií]lia/i.test(lastLine(text)) },
  { prompt: 'What is 899 × 648?' + LAST, check: number(582552) },
  { prompt: 'What is 53606 × 73662? Give the exact integer.' + LAST, check: number(3948725172) },
  { prompt: 'What day of the week is 3,200 days after November 14, 1998?' + LAST, check: says('Sunday') },
  { prompt: 'How many months from January 1953 through December 1988 have a Friday that falls on day 13?' + LAST, check: number(63) },
  { prompt: 'Write at least 40 words about a thunderstorm without using the letter "e" anywhere. Reply with only the text.', check: all(without('e'), atLeastWords(40)) }
];
