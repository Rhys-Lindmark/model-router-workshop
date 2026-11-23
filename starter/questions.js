// LEVEL 2 · YOUR JUDGMENTS: ask Jev a question of your own about every prompt.
//
//   npm run app        Level 2 tab: typed prompts ask your questions live (needs a Jev key)
//   npm run ask        asks Jev these questions about all 168 eval prompts
//                      (needs TYPESAFE_API_KEY; well under a cent in total)
//
// Then use the answer in starter/policy.js as j.<name> (true at ≥ 0.5) or
// j.p.<name> (the probability).
//
// Good router questions are judgments about the prompt, not decisions:
// "Does this need exact digits?", not "Does this need a big model?".
// The test: could a smart person answer it from the prompt alone, without
// asking you what you care about?
//
// A Noul is a yes/no question answered with a probability. Criteria say what
// true and false mean; concrete examples help most.

export const MY_QUESTIONS = {
  // has_numbers: { type: 'noul', instructions: 'Does `prompt` contain numbers that the answer must compute with?', criteria: {
  //   true: 'The answer requires arithmetic on numbers given in the prompt.',
  //   false: 'There are no numbers to compute with, or they are incidental.'
  // } },
};
