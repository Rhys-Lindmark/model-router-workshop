# Facilitator guide

The session is “I do, you do”: at each level you show your version on your live page, ask the room a question, and then they build theirs in `npm run app`. It runs in two lengths.

- **15 minutes.** A talk with questions for the room. The “you do” slides become launch points of about 30 seconds each, and people finish in the repo afterwards.
- **45 to 60 minutes.** A real workshop: give each “you do” slide 5 to 10 minutes and walk the room.

## Before the session

- [ ] `npm run doctor -- --live` and `npm test` pass on the presenting laptop.
- [ ] `npm run slides`, open http://localhost:3402, press **F**. Press **P** for the presenter view on your own screen; it follows the main window and shows how many reveals are left on each slide.
- [ ] `npm run app` is open in a second tab (http://localhost:3401) for the demos.
- [ ] Your live page is open and signed in: https://ai.rhyslindmark.com/jev/model-router.
- [ ] You know how attendees get a Jev key. It’s in early access: arrange keys or credits with TypeSafe beforehand if you can. Without a key, attendees can still do every step on the eval prompts.

## How the slides work

Slides with questions for the room have hidden parts. **→** reveals the next part before moving on, so you can ask the question, wait, and then reveal. **←** hides it again.

## Run of show

| Slide | 15 min | 45–60 min | What happens |
| - | - | - | - |
| 1 · Title | 0:00 | 0:00 | “By the end you’ll have one running on your laptop.” |
| 2 · Show of hands | 0:30 | 0:30 | Jev? Classifier? Model routing? A bill to shrink? Use the answers to pace slides 4 to 6. |
| 3 · Today | 1:15 | 1:30 | Everyone pastes the agent prompt now, so cloning runs while you talk. |
| 4 · The idea | 2:00 | 3:00 | “Which would you ship?” Reveal perfect routing, then the definition. |
| 5 · Quiz | 3:00 | 4:30 | Let them guess for 15 seconds, reveal, then reveal the pattern. |
| 6 · Meet Jev | 4:00 | 6:00 | A judgment model, not a decision model. Link it to “classifier”. |
| 7–8 · Level 1, I do | 5:00 | 8:00 | Show the live Choice card. **Ask: good or bad?** Take 2 or 3 answers, then reveal the list. |
| 9 · Keys | 6:30 | 11:00 | 15 min: point at docs/KEYS.md. 45 min: 5 minutes, walk the room. |
| 10 · Level 1, you do | 7:00 | 16:00 | 15 min: “open the app, click the quiz prompts”. 45 min: 5 minutes. |
| 11–12 · Level 2, I do | 7:30 | 21:00 | Judgments and the human test. Show the live v1 trace: Roth IRA → Opus, high. **Ask: right call? How would you know?** |
| 13 · Level 2, you do | 9:30 | 25:00 | 45 min: 10 minutes writing rows and one question. |
| 14–16 · Level 3, I do | 10:00 | 35:00 | The eval, the chart, and what it taught: exact details and long procedures. v1 scored worse than Level 1! |
| 17 · Level 3, you do | 13:00 | 42:00 | Score against Bronze/Silver/Gold, then my-eval. 45 min: 10 to 15 minutes. |
| 18 · Recap | 14:00 | 55:00 | The ladder, `npm run chat`, links. |

If you run long in the 15-minute version, skip slide 9 (say “keys are in docs/KEYS.md”) and slide 13.

## The thread to keep pulling

One prompt runs through the talk: **“Compare a Roth IRA and a traditional 401(k) for someone earning $90k.”**

- Level 1, “which model?”: Sonnet, 0.72, and no reason why (slide 7).
- Level 2, my first table: Opus at high effort, because expertise came back 0.40, my code reads “unsure” as yes, and the answer is plan-sized (slide 12).
- After the eval, Router v2: Sonnet at low effort, because nothing about it needs exact details or a long procedure (slide 16).

The quiz prompts (slide 5) are in the app’s chip row, so you can click them live at Level 1 and Level 2.

## Live demos

- **Level 1:** in the app, Level 1 tab, click “What is 53606 × 73662?”. The Choice says Opus. The eval strip shows that even the small model passes at high effort. Expensive and unexplained.
- **Level 2:** Level 2 tab, the “How many months from January 1953…” prompt. Show the trace (exact details 0.91, long procedure 0.94), then edit `starter/policy.js` live to add an exact-details row, refresh, and watch the matched row change.
- **Level 3:** Level 3 tab: the table updates with your edit. Then `npm run score -- --policy starter --misses` in the terminal.

## Questions you’ll get

**“Why not just always use the medium model?”** On my prompt set, you could: it scores the same as my best router. You only know that because you ran the eval. A router earns its keep when you don’t know the right fixed choice in advance, or when your traffic changes.

**“Isn’t Jev another LLM call?”** Yes: one per prompt, with every question in one request. `jev-1.14.0` bills $0.042 per million input tokens and nothing for output, so a router call of about 1,000 tokens costs around $0.00004, or about 4 cents per thousand prompts. Compare that with $3.20 versus $11.08 per thousand prompts for the models.

**“Why are the tiers called Haiku, Sonnet and Opus if you ran Qwen?”** The router’s tables name Claude tiers, as on the live page. The eval used one open model family so differences between tiers weren’t swamped by differences between families.

**“Couldn’t I overfit the table?”** Yes, and in the exercise you can, because you can see the test set. I built Router v2 from 60 separate training prompts.

## After the session

Point people to [WORKSHOP.md](WORKSHOP.md), [KEYS.md](KEYS.md) and [AGENTS.md](../AGENTS.md), and to the live page.
