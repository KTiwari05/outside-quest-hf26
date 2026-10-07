"""Record real local generation receipts; run while the backend is running."""
import json
from datetime import datetime, timezone
from pathlib import Path

import httpx

receipts = []
for selection in (
    {"minutes": 10, "surroundings": "park", "pace": "stroll"},
    {"minutes": 5, "surroundings": "balcony", "pace": "stay"},
):
    response = httpx.post("http://127.0.0.1:8001/api/quest", json=selection, timeout=250)
    receipt = {"checked_at": datetime.now(timezone.utc).isoformat(), "selection": selection,
               "status": response.status_code, "response": response.json()}
    receipts.append(receipt)
    Path(__file__).with_name("live-answers.json").write_text(json.dumps(receipts, indent=2), encoding="utf-8")
    print(json.dumps(receipt), flush=True)
    response.raise_for_status()
