import base64
import time

import httpx

from app.config import settings
from app.providers.base import TryonProvider, TryonResult

# Kling AI Virtual Try-On: $0.07 per image (PAYG)
# https://klingai.com/global/dev/model/tryon
COST_PER_RUN_USD = 0.07
API_BASE = "https://api.klingai.com/v1"
POLL_INTERVAL = 3
POLL_TIMEOUT = 300


def _get_jwt_token() -> str:
    import jwt  # PyJWT

    payload = {
        "iss": settings.kling_api_key,
        "exp": int(time.time()) + 1800,
        "nbf": int(time.time()) - 5,
    }
    return jwt.encode(payload, settings.kling_api_secret, algorithm="HS256")


class KlingProvider(TryonProvider):
    def run(
        self,
        person_bytes: bytes,
        garment_bytes: bytes,
        category: str,
        garment_description: str = "",
    ) -> TryonResult:
        if not settings.kling_api_key or not settings.kling_api_secret:
            raise ValueError("KLING_API_KEY and KLING_API_SECRET not set")

        token = _get_jwt_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        person_b64 = base64.b64encode(person_bytes).decode()
        garment_b64 = base64.b64encode(garment_bytes).decode()

        t0 = time.perf_counter()

        with httpx.Client(timeout=30) as client:
            resp = client.post(
                f"{API_BASE}/images/kolors-virtual-try-on",
                headers=headers,
                json={
                    "human_image": person_b64,
                    "cloth_image": garment_b64,
                },
            )
            resp.raise_for_status()
            task_id = resp.json()["data"]["task_id"]

            elapsed = 0.0
            while elapsed < POLL_TIMEOUT:
                time.sleep(POLL_INTERVAL)
                elapsed += POLL_INTERVAL

                status_resp = client.get(
                    f"{API_BASE}/images/kolors-virtual-try-on/{task_id}",
                    headers=headers,
                )
                status_resp.raise_for_status()
                data = status_resp.json()["data"]

                if data["task_status"] == "succeed":
                    result_url = data["task_result"]["images"][0]["url"]
                    break
                elif data["task_status"] == "failed":
                    raise RuntimeError(f"Kling failed: {data.get('task_status_msg')}")
            else:
                raise TimeoutError("Kling prediction timed out")

            img_resp = client.get(result_url, timeout=60)
            img_resp.raise_for_status()

        latency = time.perf_counter() - t0

        return TryonResult(
            image_bytes=img_resp.content,
            latency_seconds=latency,
            cost_usd=COST_PER_RUN_USD,
            provider="kling",
        )
