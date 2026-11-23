# Facilitator guide

A 15-minute session: about 11 minutes of slides with one live demo, 3 minutes for the room to run step 1, and a minute for questions. The deck carries the talk; the repo carries the exercises, which people finish afterwards.

## Before the session

- [ ] `npm run doctor` and `npm test` pass on the presenting laptop.
- [ ] `npm run slides`, open http://localhost:3402, press **F** for fullscreen. Press **P** to open the presenter view on your own screen; it follows the main window.
- [ ] A terminal is open in the repo, font size large enough to read from the back, ready for the demo on slide 8.
- [ ] Run `npm run route -- --offline calendar-15` once, so you know what the output looks like.
- [ ] Optional: put a `TYPESAFE_API_KEY` in `.env` and try one live prompt. Don’t depend on venue Wi-Fi: the offline demo shows the same thing.
- [ ] Put the repo URL on the title slide in the chat or on a sign: `github.com/Rhys-Lindmark/model-router-workshop`.

## Run of show

| Time | Slides | What happens |
| - | - | - |
| 0:00 | 1 | Title. Ask people who want to follow along to clone now. |
| 0:45 | 2 | The problem: a 22× price gap, and the big model still isn’t perfect. |
| 1:45 | 3–4 | The anti-pattern: “Which model should I use?”, and four reasons it’s worse. |
| 3:30 | 5–7 | The pattern: Jev judges, code decides. The questions, then the table. |
| 5:30 | 8 | **Demo.** Switch to the terminal. |
| 7:00 | 9–10 | The eval, then the results chart. |
| 8:30 | 11–12 | What the eval taught: exact details and long procedures. Router v2. |
| 10:00 | 13 | The honest part: a fixed choice ties the best router on this set. |
| 11:00 | 14 | Your turn: everyone runs `npm run score`. Walk the room or read out results. |
| 14:00 | 15 | Takeaways and links. One question if there’s time. |

If you’re running long, cut slide 6 (the questions in code) and say “five questions about the prompt, none of which mention a model”. Slide 13 is the one not to cut: it’s what makes the rest believable.

## The demo (slide 8)

```bash
npm run route -- --offline calendar-15
```

Point at, in order:

1. The two yes answers: exact details 0.91, long procedure 0.94. “Jev never said which model. It said this needs exact digits and a long procedure.”
2. The matched row, row 1. “That’s the decision, and it’s a line of code you can read.”
3. The compare line and the eval result. “Router v1 sent this to the small model, which got it wrong. ‘Which model?’ picked the large model, which got it right at almost five times the cost. This picked the medium model at high effort, and it passed.”

If you have a key and the network is good, route something the audience shouts out. Good ones: “What’s the capital of Australia?” (small model, low effort), “Count the r’s in strawberry” (exact details), “Write a 3,000-word short story” (large piece of work).

Fallback if the terminal fails: slide 8 already shows the output.

## Questions you’ll get

**“Why not just always use the medium model?”** On this prompt set, you should. That’s slide 13. You only know it because you ran the eval. A router keeps making that call when you don’t know the right fixed choice in advance, or when your traffic changes.

**“Isn’t Jev itself an LLM call? Doesn’t that add cost and latency?”** Yes: one call per prompt, with every question in one request. `jev-1.14.0` bills $0.042 per million input tokens and nothing for output, so a request of about 1,000 tokens costs around $0.00004, or about 4 cents per thousand prompts. Compare that with $3.20 versus $11.08 per thousand prompts for the models themselves. Whether the extra latency is worth it depends on your product.

**“Why are the tiers called Haiku, Sonnet and Opus if you ran Qwen?”** The router’s table names Claude tiers, as on the live page. The eval used one open model family so differences between tiers weren’t swamped by differences between families. The gaps between Claude tiers won’t be the same.

**“How is Router v3 different?”** Same judgments, but a small logistic model per option estimates the chance it passes, and the router picks the best chance minus λ × cost. It scores 93.5%. Router v2 is the one in the talk because you can read it.

**“Couldn’t I overfit the table?”** Yes, and in the exercise you can, because you can see the test set. The real eval built Router v2 from 60 separate training prompts.

## After the session

Point people to [WORKSHOP.md](WORKSHOP.md) for steps 2 to 4 and to the live page for the interactive version.
