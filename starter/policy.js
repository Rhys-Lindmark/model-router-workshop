// LEVEL 2 · YOUR TABLE. Jev judges each prompt; this table decides.
//
//   npm run app                                  Level 2 tab: click prompts, see which row matches
//   npm run score -- --policy starter            score it on 168 held-out prompts
//   npm run score -- --policy starter --misses   see what it got wrong
//   npm run route -- --policy starter "Count the r's in strawberry"
//
// Each row tests the judgments `j` and picks an option. Rows are tried in
// order; the first match wins; the last row must always match.
//
// Judgments (true when Jev's probability is ≥ 0.5):
//   j.exact_details    Does a correct answer depend on exact letters, words or digits?
//   j.long_procedure   Does it need a long step-by-step procedure?
//   j.quick_recall     Can it be answered by recalling one fact or one simple step?
//   j.writes_code      Does it ask for code?
//   j.large_output     Does it ask for a large piece of work?
//   j.expertise        Does it take specialist expertise?
//   j.high_stakes      Could a wrong answer cause real harm or cost?
//   j.nuanced_writing  Does it ask for writing where tone and style matter?
//   j.depth            How much working out: 0 none, 1 a few steps, 2 a plan, 3 long
//   j.p.<name>         The raw probability behind any judgment, e.g. j.p.exact_details > 0.8
//   j.<your question>  Anything you add in starter/questions.js (after npm run ask)
//
// Options, cheapest to strongest (cost per 1,000 prompts if used for everything):
//   'haiku:low'   $0.51     'haiku:high'  $0.82      small model
//   'sonnet:low'  $2.74     'sonnet:high' $3.32      medium model
//   'opus:low'    $9.04     'opus:high'   $11.08     large model
//
// Targets on the held-out prompts (each must also beat random routing):
//   Bronze  match "Which model should I use?" for less   ≥ 85.7% for ≤ $7.37
//   Silver  beat Router v2                                > 91.1% for ≤ $3.32
//   Gold    match the best single option for less        ≥ 93.5% for < $3.32 (always sonnet:high)
//
// Fair warning: you can see the test prompts' results, so you can overfit.
// The real eval built Router v2 from 60 separate training prompts. A row you
// can explain in one plain sentence is worth more than one extra point.

export const TABLE = [
  // TODO 1: The small model miscounts letters and digits. Where should
  //         prompts with j.exact_details go?
  // { when: 'Exact letters, words or digits', test: j => j.exact_details, option: '…' },

  // TODO 2: Easy lookups don't need the medium model. Try j.quick_recall.

  // TODO 3: Long procedures (dates across decades, many cases) trip small
  //         models. Try j.long_procedure.

  { when: 'Otherwise', test: () => true, option: 'sonnet:low' }
];
