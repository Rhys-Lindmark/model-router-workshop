// The questions the router asks Jev about a prompt. Jev answers each with a
// probability. Nothing here names a model or a price: that policy lives in
// code (src/policy.js), where you can read it, test it and change it.
//
// Copied from the live page: https://ai.rhyslindmark.com/jev/model-router

// ---- Router v1: the first five judgments ------------------------------------
export const V1_QUESTIONS = {
  reasoning_depth: { type: 'score', instructions: 'How much working out does a good answer to `prompt` take?', criteria: [
    'None: a greeting, a quick lookup, or a fact most people know.',
    'A few straightforward steps, such as a unit conversion, a short rewrite, or a small standard piece of code.',
    'A plan with several connected steps, such as comparing options, explaining a tricky concept, or debugging a specific problem.',
    'Long, careful reasoning across many parts, such as a proof, designing a system, or a multi-stage project.'
  ] },
  expertise: { type: 'noul', instructions: 'Does answering `prompt` well take specialist expertise?', criteria: {
    true: 'A practising expert, such as a doctor, lawyer, engineer or scientist, would answer noticeably better than a well-read generalist.',
    false: 'A well-read generalist could answer as well as an expert.'
  } },
  high_stakes: { type: 'noul', instructions: 'Could a wrong answer to `prompt` cause real harm or cost?', criteria: {
    true: 'A mistake could affect someone’s health, money, legal position, security, or a production system.',
    false: 'A mistake would be easy to notice and cheap to fix, such as a wrong trivia answer or a weak joke.'
  } },
  large_output: { type: 'noul', instructions: 'Does `prompt` ask for a large piece of work?', criteria: {
    true: 'The user wants a whole application, a long document, or many separate deliverables.',
    false: 'The user wants a short answer, a single function, or a few paragraphs.'
  } },
  nuanced_writing: { type: 'noul', instructions: 'Does `prompt` ask for writing where tone and style matter?', criteria: {
    true: 'The user wants persuasive, sensitive, creative or carefully edited prose.',
    false: 'Style barely matters: the user wants facts, code, numbers or a quick reply.'
  } }
};

// ---- Router v2: four judgments written from where v1 failed in the eval -----
// Failures came from exact, letter-level work and long step-by-step
// procedures, not from "expertise" or "stakes".
export const V2_QUESTIONS = {
  exact_details: { type: 'noul', instructions: 'Does a correct answer to `prompt` depend on getting exact letters, words or digits right?', criteria: {
    true: 'One miscounted or misplaced letter, word or digit makes the answer wrong: counting letters, writing exactly N words, avoiding a letter, or multiplying large numbers exactly.',
    false: 'Small slips in wording would not make the answer wrong: explaining a concept, chatting, recalling a fact, or writing ordinary prose.'
  } },
  quick_recall: { type: 'noul', instructions: 'Can `prompt` be answered by recalling one well-known fact or doing one simple step?', criteria: {
    true: 'A capital city, a chemical symbol, a definition, a single small calculation or a greeting.',
    false: 'The answer needs several steps of reasoning, a piece of writing, or code.'
  } },
  writes_code: { type: 'noul', instructions: 'Does `prompt` ask for code to be written?', criteria: {
    true: 'The user wants a function, script, class or program.',
    false: 'The user wants an answer, an explanation or prose, not code.'
  } },
  long_procedure: { type: 'noul', instructions: 'Does answering `prompt` require carrying out a long procedure step by step, such as checking many cases or tracking many items?', criteria: {
    true: 'The answer comes from many repeated steps: counting dates across decades, checking every number in a large range, or tracking several people’s statements.',
    false: 'The answer takes a few steps at most.'
  } }
};

// ---- The anti-pattern: ask Jev for the decision itself -----------------------
// Worded as in the first draft on purpose. The options are labels, so the
// answer depends on what the model happens to know about each one.
export const CHOICE_QUESTION = {
  model_choice: { type: 'choice', instructions: 'Which model should I use for this prompt?', criteria: {
    Haiku: 'Claude Haiku', Sonnet: 'Claude Sonnet', Opus: 'Claude Opus', Fable: 'Claude Fable'
  } }
};

// Everything in one request. Questions in one request never see each other.
export const ALL_QUESTIONS = { ...V1_QUESTIONS, ...V2_QUESTIONS, ...CHOICE_QUESTION };
