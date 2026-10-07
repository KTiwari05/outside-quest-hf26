# Outside Quest

One small outdoor observation activity, made for the time and space you have.
Choose 5, 10, or 20 minutes, a park, neighborhood, or balcony, and whether to
stroll or stay in one spot. Qwen generates three short steps and a reflection
question. Read the takeaway view or save a text file, then put the screen away.

Started October 7, 2026 for Hacktoberfest Week 1, **Touch Grass**. This is a new
project, separate from Interview Buddy. It uses the same familiar development
stack and local inference approach, with a new workflow, interface, and prompts.

## Run locally

Requirements: Python 3.11+, Node.js 22.12+, [uv](https://docs.astral.sh/uv/),
and [Ollama](https://ollama.com/). Keep Ollama running and download the model:

```powershell
ollama pull qwen3:4b
```

Build the frontend, from this repository:

```powershell
cd frontend
npm ci
npm run build
```

Start the backend from the same repository:

```powershell
cd backend
uv sync --locked
uv run uvicorn main:app --host 127.0.0.1 --port 8001
```

Open **http://127.0.0.1:8001/**. One process serves both the production UI and API.
The build must exist before starting the backend. API docs are at `/docs`, the
schema at `/openapi.json`, and service health at `/api/health`. Health confirms
the application process; it does not prove Ollama is available.

For frontend development, run `npm run dev` in `frontend` in another terminal.
Its URL is http://127.0.0.1:5174/; `/api` proxies to the backend on port 8001.

## How it works

```text
Time + surroundings + pace
           |
       React / Vite
           | POST /api/quest
         FastAPI
           | Ollama /api/chat + JSON schema
        Qwen3 4B
           |
    Three steps + reflection
           |
     Takeaway view / text file
```

The backend validates the selections and the model's structured reply. Missing,
blank, oversized or truncated replies are rejected with an actionable error.
There is no fallback pretending to be a real model response. Balcony activities
always request a seated, stationary activity; other surroundings allow either pace.

The model is instructed to avoid named routes, weather claims, species identification,
equipment, companions, and assumptions that particular wildlife is present. It
should focus on directly observable details. Prompt instructions are not a guarantee
of appropriate output: review a generated activity before following it.

There are no accounts, database, maps, GPS requests, analytics, or hosted model calls.
The app holds selections and replies in memory; refreshing clears them. The exported
text can be read without this app or a connection. The app itself is not an installable
offline phone app, and generation requires the local backend and Ollama service.
Initial dependency and model downloads require internet.

`OLLAMA_MODEL` and `OLLAMA_URL` are backend environment settings. Qwen3 4B is the
tested model; other models and remote Ollama configurations have not been verified.

## Verification and submission

```powershell
cd backend
uv run python -m unittest -v
```

```powershell
cd frontend
npm run build
```

See [verification notes](submission/VERIFICATION.md) for the checks actually run
and their limits. [Live API responses](submission/live-answers.json) and the
browser receipt preserve real generation output. The production build contains
only local assets and uses system fonts.

The [DEV Week 1 submission](https://dev.to/ktiwari05/outside-quest-three-steps-then-put-the-screen-away-4oea)
was published October 7, 2026 with `devchallenge` and `hf26challenge` tags.
The [video walkthrough](submission/demo/outside-quest-walkthrough.webm) and
[article source](submission/DEV_SUBMISSION.md) are included here. The
[submission checklist](submission/SUBMIT_CHECKLIST.md) records the publication
status. Outdoor use and Hacktoberfest reward credit remain unverified.

## Licenses and credits

Application code is MIT licensed. Model weights are not bundled. Qwen3, Ollama,
FastAPI, Uvicorn, httpx, React, and Vite retain their own upstream licenses.
See the [Qwen3 4B model page](https://ollama.com/library/qwen3:4b) and
[Qwen3 release](https://qwenlm.github.io/blog/qwen3/) for model provenance.
The SVG landscape and icon were drawn for this project. No external images or fonts
are required. Codex assisted with implementation, verification, and the draft.

## Challenge dates

The [Week 1 official rules](https://dev.to/page/hacktoberfest-week1-2026-10-05-contest-rules)
set the entry period to October 5, 2026 at 9:00 AM PDT through October 11 at
11:59 PM PDT. The deadline is **October 12, 2026 at 12:29 PM IST**.
The project and its repository must be created and completed within that window.
Any commits after the deadline must be noted here.

Post-deadline changes: none recorded.
