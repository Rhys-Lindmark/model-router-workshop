// LEVEL 1 · Ask Jev for the decision.
//
// The first router most people write: one Choice question, take the top answer.
// This is the one I started with. Run it, look at what it picks, and decide
// whether it's a good question. Then try to improve the wording or the options.
//
//   npm run app          click Level 1, pick a prompt
//   npm run ask          (needs a Jev key) asks your edited version about all 168 eval prompts
//   npm run score        then shows how your version scores as "Your Choice"
//
// Option keys must be tier names: haiku (small), sonnet (medium), opus (large).
// `fable` also works and means the largest tier.

export const CHOICE = {
  type: 'choice',
  instructions: 'Which model should I use for this prompt?',
  criteria: {
    haiku: 'Claude Haiku',
    sonnet: 'Claude Sonnet',
    opus: 'Claude Opus',
    fable: 'Claude Fable'
  }
};

// A Choice can't say how hard to think, so pick one effort for every prompt.
export const EFFORT = 'high';
