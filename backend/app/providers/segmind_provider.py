import base64
import time

import httpx

from app.config import settings
from app.providers.base import TryonProvider, TryonResult

# Segmind Try-On Diffusion: billed per GPU-second (~$0.0108/s)
# Average ~30s per run ≈ $0.03-0.05 per image
COST_PER_RUN_USD = 0.04  # estimated average
API_URL = "https://api.segmind.com/v1/try-on-diffusion"


class SegmindProvider(TryonProvider):
    def run(
        self,
        person_bytes: bytes,
        garment_bytes: bytes,
        category: str,
        garment_description: str = "",
    ) -> TryonResult:
        if not settings.segmind_api_key:
            raise ValueError("SEGMIND_API_KEY not set")

        person_b64 = base64.b64encode(person_bytes).decode()
        garment_b64 = base64.b64encode(garment_bytes).decode()

        t0 = time.perf_counter()

        with httpx.Client(timeout=120) as client:
            resp = client.post(
                API_URL,
                headers={"x-api-key": settings.segmind_api_key},
                json={
                    "model_image": person_b64,
                    "dress_image": garment_b64,
                    "category": category,
                    "num_inference_steps": 35,
                    "guidance_scale": 2,
                    "seed": 12467,
                    "base64": True,
                },
            )
            resp.raise_for_status()
            latency = time.perf_counter() - t0

            result_b64 = resp.json().get("image", "")
            image_bytes = base64.b64decode(result_b64)

        return TryonResult(
            image_bytes=image_bytes,
            latency_seconds=latency,
            cost_usd=COST_PER_RUN_USD,
            provider="segmind",
        )
