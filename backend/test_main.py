import json
import unittest
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

import main

QUEST = {
    "title": "A small sound safari",
    "invitation": "Make room for the sounds around you.",
    "steps": ["Find a familiar spot.", "Listen for three different sounds.", "Notice which is closest."],
    "reflection": "Which sound would you normally miss?",
}


class QuestTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)

    def generate(self, handler, payload=None):
        factory = httpx.AsyncClient
        with patch("main.httpx.AsyncClient", side_effect=lambda **kw: factory(
            transport=httpx.MockTransport(handler), **kw
        )):
            return self.client.post("/api/quest", json=payload or {})

    def test_real_request_contract_and_structured_response(self):
        def handler(request):
            body = json.loads(request.content)
            self.assertEqual(request.url.path, "/api/chat")
            self.assertFalse(body["stream"])
            self.assertFalse(body["think"])
            self.assertEqual(body["format"]["properties"]["steps"]["minItems"], 3)
            self.assertIn("Time: 5 minutes. Surroundings: balcony. Pace: stay.", body["messages"][1]["content"])
            return httpx.Response(200, json={"message": {"content": json.dumps(QUEST)}})
        response = self.generate(handler, {"minutes": 5, "surroundings": "balcony", "pace": "stay"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["quest"], QUEST)
        self.assertGreaterEqual(response.json()["seconds"], 0)

    def test_invalid_user_input_never_calls_model(self):
        for payload in ({"minutes": 1}, {"surroundings": "forest"}, {"pace": "run"}, {"extra": True}):
            with self.subTest(payload=payload), patch("main.httpx.AsyncClient") as client:
                self.assertEqual(self.client.post("/api/quest", json=payload).status_code, 422)
                client.assert_not_called()

    def test_connection_failure(self):
        def handler(request):
            raise httpx.ConnectError("offline", request=request)
        self.assertEqual(self.generate(handler).status_code, 503)

    def test_timeout(self):
        def handler(request):
            raise httpx.ReadTimeout("slow", request=request)
        self.assertEqual(self.generate(handler).status_code, 504)

    def test_missing_model(self):
        self.assertEqual(self.generate(lambda _: httpx.Response(404)).status_code, 503)

    def test_bad_model_responses(self):
        for body in ({}, {"message": None}, {"message": {"content": "not json"}},
                     {"message": {"content": json.dumps({**QUEST, "steps": ["Only one"]})}},
                     {"message": {"content": json.dumps({**QUEST, "title": "   "})}}):
            with self.subTest(body=body):
                self.assertEqual(self.generate(lambda _: httpx.Response(200, json=body)).status_code, 502)

    def test_truncated_generation(self):
        self.assertEqual(self.generate(lambda _: httpx.Response(200, json={
            "done_reason": "length", "message": {"content": json.dumps(QUEST)}
        })).status_code, 502)

    def test_qwen_reasoning_prefix(self):
        response = self.generate(lambda _: httpx.Response(200, json={
            "message": {"content": "<think>planning</think>" + json.dumps(QUEST)}
        }))
        self.assertEqual(response.status_code, 200)

    def test_health_and_openapi(self):
        self.assertEqual(self.client.get("/api/health").json()["status"], "ok")
        self.assertEqual(self.client.get("/openapi.json").status_code, 200)


if __name__ == "__main__":
    unittest.main()
