# The Boardroom 🪑

A live **multi-agent debate**. You put a decision on the table, and a panel of four
opinionated AI advisors argues it out — opening positions, rebuttals, changed minds —
then a neutral Chair delivers a structured verdict. Everything streams in real time.

Built as an AI-native portfolio piece. The interesting part isn't the chat UI — it's the
**orchestration**: distinct personas, a turn-taking protocol, a shared transcript each
agent reasons over, and emergent (unscripted) back-and-forth.

## The cast

| Advisor | Role | Agenda |
|---|---|---|
| **Nadia** | The Visionary | Upside, ambition, the cost of inaction |
| **Marcus** | The Skeptic | Risk, downside scenarios, hidden costs |
| **Priya** | The Operator | Execution, resources, "what does Monday look like" |
| **Theo** | The Devil's Advocate | Challenges the emerging consensus, fights groupthink |
| **The Chair** | Moderator | Synthesizes the debate into a decisive verdict |

## How it works

```
Round 1  Nadia → Marcus → Priya → Theo     (opening positions)
Round 2  Nadia → Marcus → Priya → Theo     (rebuttals; agents may change their mind)
Verdict  The Chair                          (recommendation · why · risk · confidence)
```

Each turn is a separate model call (via OpenRouter). Every agent is prompted with its
persona, the decision, and the **full running transcript**, so it responds to what
others actually said. Turns stream to the browser over Server-Sent Events; the frontend
lights up each advisor's seat as they speak.

## Project structure

A **modular monolith** — one deployable app, cohesive modules in folders:

```
boardroom/
├─ server.js                    # thin entry point — boots the app
├─ public/index.html           # single-page frontend (inline CSS/JS)
└─ src/
   ├─ config.js                 # env + constants
   ├─ app.js                    # express app factory
   ├─ llm/
   │  └─ openrouter.js          # model provider: streamChat()
   ├─ debate/
   │  ├─ personas.js            # the cast + debate rules
   │  ├─ prompts.js             # prompt builders (pure functions)
   │  └─ orchestrator.js        # the turn-taking loop — no HTTP knowledge
   └─ routes/
      ├─ panel.js               # GET  /api/panel
      └─ debate.js              # POST /api/debate (SSE wiring)
```

The key boundary: the **orchestrator** emits events through an `emit(event, data)`
callback and knows nothing about HTTP, so the route adapts those into SSE while the
engine stays reusable (a CLI, a test, or a websocket could drive it unchanged). Swapping
models or providers only touches `src/llm/`.

## Run it

Needs `OPENROUTER_API_KEY` in a `.env` in this folder.

```bash
# from this folder
npm install        # only if parent node_modules isn't already present
npm start

# or, from the parent project
npm run boardroom
```

Then open **http://localhost:3100**.

Config via env:
- `OPENROUTER_API_KEY` — your key from https://openrouter.ai/keys
- `OPENROUTER_MODEL` — any model id (default `meta-llama/llama-3.3-70b-instruct`; append `:free` for free tiers)
- `BOARDROOM_PORT` — default `3100`

## Design notes / things handled

- **Provider-agnostic** — all model specifics live behind `src/llm/`, so switching models
  or providers is a one-file change.
- **Rate-limit resilience** — retry with exponential backoff on 429/503 plus light pacing,
  so the ~9-call burst survives a tight rate limit.
- **Always terminates** — fixed rounds + a budgeted verdict, never an open-ended loop.
- **Client disconnect aborts** the upstream calls so a closed tab stops burning tokens.

## Ideas to take it further

- Let the Chair pick who speaks next instead of round-robin (more emergent).
- Give each advisor private "notes" (separate memory) distinct from the public transcript.
- Let the user add their own advisor, or interject mid-debate.
- Persist past debates and make them shareable.
