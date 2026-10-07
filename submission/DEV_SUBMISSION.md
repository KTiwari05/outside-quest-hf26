---
title: "Outside Quest: three steps, then put the screen away"
published: true
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

## What I Built

Outside Quest turns a small gap in the day into one outdoor observation activity.
Choose 5, 10, or 20 minutes, select a park, neighborhood, or balcony, and decide
whether to take a gentle stroll or stay in one spot. It generates three short
steps and a question to think about afterwards.

The starting point is deliberately ordinary. You do not need a trail, a species
identification app, or a planned trip. A familiar outdoor space is enough. Balcony
activities stay in one spot, so going outside does not have to mean going for a walk.

The takeaway view removes the planner and leaves the activity. A text download
lets you read it later without keeping the app open. There is no timer to watch,
feed to scroll, or streak to maintain. The intended interaction is brief: choose,
read, then put the screen away.

I have not yet tested the activity outdoors or measured whether it changes anyone's
screen time. The current evidence covers the software and local model workflow.

## Demo

[Watch the 22-second browser walkthrough](https://github.com/KTiwari05/outside-quest-hf26/blob/master/submission/demo/outside-quest-walkthrough.webm).

The silent video shows a real generated activity, the takeaway view, and the text
download. Generation happened before recording; that neighborhood reply took
45.74 seconds. This is a local application demo, not a publicly hosted inference
service. Setup instructions are in the repository.

![Outside Quest planner](https://raw.githubusercontent.com/KTiwari05/outside-quest-hf26/master/submission/demo/01-planner.png)

![Takeaway view with a generated outdoor activity](https://raw.githubusercontent.com/KTiwari05/outside-quest-hf26/master/submission/demo/05-takeaway.png)

## Code

[Outside Quest source code and setup instructions](https://github.com/KTiwari05/outside-quest-hf26).

The application code is MIT licensed. Model weights are installed separately and
retain their upstream license.

## How I Built It

React and Vite provide the planner and activity card. A FastAPI endpoint sends
the selections to Qwen3 4B through Ollama's local chat API. A JSON schema asks
the model for a title, invitation, exactly three steps, and a reflection question.
Pydantic validates the reply before it reaches the interface.

```text
Time + surroundings + pace -> FastAPI -> Ollama / Qwen3 4B
                                      -> Three steps -> Takeaway view / text
```

The open-weight model creates the actual activity. A failed call produces a
retry message, rather than a canned answer presented as generated output.

Live checking mattered. An early balcony response asked what a bird's sound
revealed about its mood. That was speculative, so I changed the prompt to focus
on directly observable details and the person's own experience. Another activity
assumed a friend was present; the prompt now explicitly asks for a solo activity.
These instructions are requests, not a guarantee that every generated activity
will be suitable.

The implementation stays small: no accounts, storage, location tracking, route
data, agents, or paid inference API. The model does not know nearby places or
current weather. The application runs locally; its text export is the portable
part of the experience.

Nine backend tests passed. They cover valid requests, invalid selections, connection
failures, timeouts, missing models, malformed replies, truncation, and a Qwen
reasoning prefix. The production frontend build passes. Verification notes in
the repository separate real generation checks from mocked failure checks. Final
park and balcony API checks took 27.23 and 17.53 seconds; the neighborhood browser
reply shown in the walkthrough took 45.74 seconds. Mobile planner and takeaway
views fit a 375-pixel screen without horizontal overflow, and the downloaded text
matched the displayed activity even with browser networking disabled.

## Why Does Open Innovation Matter?

Qwen3 4B is central to the workflow, and Ollama runs it on this computer. Once
the dependencies and weights are downloaded, the inference path uses local
endpoints. It does not require a paid model account or send these selections
to a hosted model provider.

I can inspect and change the prompts and output schema, reproduce a weak
reply, and test the next version. A different model can be configured, though
only Qwen3 4B has been checked here. The tradeoff is response latency and output
quality on local hardware. Open weights do not automatically make a reply accurate
or an activity appropriate.

The text file makes the last part independent of the AI runtime. Once you have
the activity, you can close the app and take it with you.

## My Agent Session

Codex assisted with implementation, live model checks, browser verification, and
preparing this submission. No public agent session is linked.

## Prize Categories

I am entering the overall challenge. This version uses Qwen and Ollama; it does
not claim a partner prize category.
