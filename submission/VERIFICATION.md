# Verification

Checks run October 7, 2026 on this Windows computer.

## Backend and production build

- `uv run python -m unittest -v`: **9 tests passed**, including input constraints,
  the Ollama request/schema contract, malformed/blank/incomplete replies, truncation,
  a Qwen reasoning prefix, missing model, connection error, timeout, health and OpenAPI.
- Tests mock the Ollama HTTP transport. They do not establish model quality.
- Starlette emits a deprecation warning for its current httpx-based test client.
  The tests run successfully with the pinned environment; no extra test dependency
  was introduced to suppress the warning.
- `npm run build`: passed with React 19 and Vite 7. Lockfiles are committed.
- Live production `/`, `/api/health`, `/docs`, `/openapi.json`, `/favicon.svg`, and
  the JS bundle all returned HTTP 200. The backend serves the built frontend from
  a path relative to the source, not the process working directory.
- Chromium loaded the production page at http://127.0.0.1:8001/ with no console
  errors or warnings.

## Real local generation

[live-answers.json](live-answers.json) records the final prompt's real API output:

| Selection | HTTP | Generation time |
| --- | --- | --- |
| 10 minutes, park, stroll | 200 | 27.23 seconds |
| 5 minutes, balcony, stay | 200 | 17.53 seconds |

The final park activity includes walking and pausing on a familiar path. The
balcony activity stays seated. Both have three nonempty steps and a reflection.
These two checks show examples, not compliance for every possible generated answer.

[browser-answer.json](browser-answer.json) preserves a real 20-minute stationary
neighborhood activity from the browser, generated in 45.74 seconds. It is the
response in the walkthrough. The final prompt subsequently gained an explicit
stroll instruction and a request not to require benches; the final two API
receipts above were collected after that change.

Earlier live replies motivated those changes: speculation about a bird's mood,
an assumed companion, and a seated activity despite choosing a stroll. The model
is prompted to avoid these, but output appropriateness is not deterministically
enforced. Review an activity before following it.

## Browser interaction

Playwright CLI checks in Chromium verified:

- 5, 10, and 20-minute selections and all three surroundings.
- Balcony forces the stationary option and disables pace changes. Leaving balcony
  restores the pace controls.
- During a mocked pending request, generation and selection controls disable.
- A mocked 503 displays an actionable error; the button recovers, and changing
  a selection clears the error. This is a mocked failure check, not an Ollama outage.
- A real form submission renders exactly three steps, the title, reflection and
  actual model/timing metadata.
- Take this outside hides the planner; Back to planner restores it.
- Changing a selection clears the previous activity rather than relabeling it.
- Save as text downloads `outside-quest.txt`. Its contents were read and matched
  the displayed title, time, surroundings, steps, reflection, and model name.
- Takeaway and text export worked with browser networking disabled after generation.
  This does not establish offline installation or offline reload of the app.
- At 375px, the planner, generated result and takeaway had no horizontal overflow;
  `document.documentElement.scrollWidth` did not exceed `innerWidth`.
- Desktop planner, desktop activity, desktop takeaway and mobile screenshots were
  visually inspected. No clipped content or overlapping controls was seen.

Screenshots and the walkthrough are in [demo](demo/).
The 22.33-second WebM decoded successfully with FFmpeg at 1360 x 1000 and 15 fps.
Sample frames at 5 and 12 seconds were visually inspected.

## Evidence boundaries

Outdoor trial and personal feedback are pending. No health benefit, behavioral
improvement, location accuracy, guaranteed output safety, or species identification
is claimed. Other models, browsers, operating systems and assistive technologies
have not been tested. Keyboard-compatible native radio inputs and visible focus
styles are implemented; this is not a complete accessibility audit.

The model service is local. No public inference deployment, challenge registration,
DEV publication, source/demo public link, sponsor use, or sticker credit has been
established by these checks. The DEV file is a local draft with clearly marked
publication placeholders.
