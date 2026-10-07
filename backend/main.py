import os
import time
from pathlib import Path
from typing import Annotated, Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

app = FastAPI(title="Outside Quest")
MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:4b")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class QuestRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    minutes: Literal[5, 10, 20] = 10
    surroundings: Literal["park", "neighborhood", "balcony"] = "park"
    pace: Literal["stroll", "stay"] = "stroll"


class Quest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Text = Field(max_length=70)
    invitation: Text = Field(max_length=140)
    steps: list[Annotated[Text, Field(max_length=180)]] = Field(min_length=3, max_length=3)
    reflection: Text = Field(max_length=120)


@app.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL}


@app.post("/api/quest")
async def create_quest(request: QuestRequest):
    started = time.perf_counter()
    prompt = (
        "Create one inviting outdoor observation activity for one person alone; no companion is needed. "
        "Return only the JSON described by the schema. "
        "Keep the title under 50 characters, invitation under 100 characters, each of exactly three steps "
        "under 140 characters, and one reflection question under 100 characters. Use plain language. "
        "Fit the entire activity into the time budget. No equipment, apps, photos, counting on a screen, "
        "or species identification. Observe without touching wildlife or plants. Never invent nearby places, "
        "routes, weather or facts. Stay in a familiar permitted place, away from roads and hazards. "
        "When pace is stroll, include a short gentle walk on a familiar pedestrian path, then stop to observe. "
        "Do not require a bench or furniture. "
        "For stay pace or a balcony, all steps must be possible seated in one spot, without leaving it. "
        "For a neighborhood, use sights and sounds from a familiar outdoor pedestrian space. "
        "Do not assume birds, trees or other specific objects are present; offer an alternative when needed. "
        "Ask only about directly observed details and the person's own experience, never an animal's emotions. "
        "Do not restrict attention or ask someone to close their eyes while moving. "
        "Use the reflection as a question to think about after the activity."
    )
    try:
        async with httpx.AsyncClient(timeout=240) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": MODEL,
                    "stream": False,
                    "think": False,
                    "format": Quest.model_json_schema(),
                    "messages": [
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": f"Time: {request.minutes} minutes. "
                         f"Surroundings: {request.surroundings}. Pace: {request.pace}.\n/no_think"},
                    ],
                    "options": {"temperature": 0.6, "num_predict": 600, "num_ctx": 2048},
                },
            )
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "The local model took too long. Please try again.") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(503, "Start Ollama and check that qwen3:4b is downloaded, then try again.") from exc
    try:
        result = response.json()
        if result.get("done_reason") == "length":
            raise HTTPException(502, "The model did not finish the activity. Please try again.")
        content = result["message"]["content"].split("</think>", 1)[-1].strip()
        quest = Quest.model_validate_json(content)
    except (ValueError, KeyError, TypeError, AttributeError) as exc:
        raise HTTPException(502, "The model returned an incomplete activity. Please try again.") from exc
    return {"quest": quest, "model": MODEL, "seconds": round(time.perf_counter() - started, 2)}


# Also serve the production frontend from the same local process, once built.
DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if DIST.is_dir():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="frontend")
