import base64
import time

import httpx

from app.config import settings
from app.providers.base import TryonProvider, TryonResult

# Fashn.ai Virtual Try-On v1.6 = 1 credit = $0.075 on-demand
# https://docs.fashn.ai/
COST_PER_RUN_USD = 0.075
API_BASE = "https://api.fashn.ai/v1"
POLL_INTERVAL = 3  # seconds
POLL_TIMEOUT = 300  # seconds

CATEGORY_MAP = {
    "upper_body": "tops",
    "lower_body": "bottoms",
    "dresses": "one-pieces",
}


class FashnProvider(TryonProvider):
    def run(
        self,
        person_bytes: bytes,
        garment_bytes: bytes,
        category: str,
        garment_description: str = "",
    ) -> TryonResult:
        if not settings.fashn_api_key:
            raise ValueError("FASHN_API_KEY not set")

        headers = {"Authorization": f"Bearer {settings.fashn_api_key}"}
        fashn_category = CATEGORY_MAP.get(category, "tops")

        t0 = time.perf_counter()

        person_b64 = "data:image/jpeg;base64," + base64.b64encode(person_bytes).decode()
        garment_b64 = "data:image/jpeg;base64," + base64.b64encode(garment_bytes).decode()

        with httpx.Client(timeout=30) as client:
            resp = client.post(
                f"{API_BASE}/run",
                headers={**headers, "Content-Type": "application/json"},
                json={
                    "model_name": "tryon-v1.6",
                    "inputs": {
                        "model_image": person_b64,
                        "garment_image": garment_b64,
                        "category": fashn_category,
                        "mode": "balanced",
                    },
                },
            )
            print("Fashn response:", resp.status_code, resp.text)
            resp.raise_for_status()
            prediction_id = resp.json()["id"]

            elapsed = 0.0
            while elapsed < POLL_TIMEOUT:
                time.sleep(POLL_INTERVAL)
                elapsed += POLL_INTERVAL

                status_resp = client.get(
                    f"{API_BASE}/status/{prediction_id}",
                    headers=headers,
                )
                status_resp.raise_for_status()
                data = status_resp.json()

                if data["status"] == "completed":
                    result_url = data["output"][0]
                    break
                elif data["status"] == "failed":
                    raise RuntimeError(f"Fashn.ai failed: {data.get('error')}")
            else:
                raise TimeoutError("Fashn.ai prediction timed out")

            img_resp = client.get(result_url, timeout=60)
            img_resp.raise_for_status()

        latency = time.perf_counter() - t0

        return TryonResult(
            image_bytes=img_resp.content,
            latency_seconds=latency,
            cost_usd=COST_PER_RUN_USD,
            provider="fashn",
        )
