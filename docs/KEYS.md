# Keys

You need two keys to run your own router live. You don’t need either one to score routers or replay the eval (`npm run score`, `npm run route -- --offline <id>`).

| Key | What it’s for | Where to get it |
| - | - | - |
| `TYPESAFE_API_KEY` | Jev, the model that judges each prompt | [console.typesafe.ai/keys](https://console.typesafe.ai/keys) |
| `OPENROUTER_API_KEY` | The models your router picks between (Qwen 3.7 Flash, Plus and Max) | [openrouter.ai/keys](https://openrouter.ai/keys) |

## 1 · Jev (TypeSafe)

1. Sign in at [console.typesafe.ai](https://console.typesafe.ai/) and create a key on the [Keys page](https://console.typesafe.ai/keys). Jev is in early access; if you can’t sign in, ask the workshop host or use [typesafe.ai/contact](https://typesafe.ai/contact).
2. Jev bills $0.042 per million input tokens, and output is free ([models](https://docs.typesafe.ai/models)). A router call is about 1,000 tokens, so a thousand routed prompts cost around 4 cents.

Every call is one POST. The key goes in a Bearer header:

```bash
curl https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"jev-1.14.0","state":{"prompt":"What is 53606 × 73662?"},
       "questions":{"exact_details":{"type":"noul","instructions":"Does a correct answer to `prompt` depend on getting exact digits right?"}}}'
```

The reply holds one answer per question, e.g. `{"exact_details": {"type": "noul", "noul": 0.99}}`. Docs: [quickstart](https://docs.typesafe.ai/quickstart).

## 2 · OpenRouter

1. Sign in at [openrouter.ai](https://openrouter.ai/), add a few dollars of credit, and create a key at [openrouter.ai/keys](https://openrouter.ai/keys). Setting a spending limit on the key is a good idea.
2. The workshop’s models cost from $0.51 to $11.08 per thousand prompts on the eval’s prompts. A workshop’s worth of `npm run chat` costs cents.

## 3 · Put them in `.env`

```bash
cp .env.example .env
```

Open `.env` in your editor and paste each key after the `=`, with no quotes or spaces. `.env` is git-ignored. Don’t paste keys into a chat with your coding agent: put them in the file yourself.

## 4 · Check them

```bash
npm run doctor -- --live
```

You should see:

```text
✓ Jev answers (quick_recall for "capital of France" = <a probability near 1>)
✓ OpenRouter key works
```

If a key is rejected (HTTP 401), check that it was pasted whole, with nothing else on the line.
