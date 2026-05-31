import io
import time

import httpx
import replicate

from app.providers.base import TryonProvider, TryonResult

# IDM-VTON on Replicate: ~$0.025 per prediction (A100 80GB, ~19s)
COST_PER_RUN_USD = 0.025
MODEL_VERSION = "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985"


class ReplicateProvider(TryonProvider):
    def run(
        self,
        person_bytes: bytes,
        garment_bytes: bytes,
        category: str,
        garment_description: str = "",
    ) -> TryonResult:
        person_file = io.BytesIO(person_bytes)
        person_file.name = "person.jpg"
        garment_file = io.BytesIO(garment_bytes)
        garment_file.name = "garment.jpg"

        t0 = time.perf_counter()
        output = replicate.run(
            MODEL_VERSION,
            input={
                "human_img": person_file,
                "garm_img": garment_file,
                "category": category,
                "garment_des": garment_description,
            },
        )
        latency = time.perf_counter() - t0

        result_url = str(output[0]) if isinstance(output, list) else str(output)
        resp = httpx.get(result_url, timeout=60)
        resp.raise_for_status()

        return TryonResult(
            image_bytes=resp.content,
            latency_seconds=latency,
            cost_usd=COST_PER_RUN_USD,
            provider="replicate",
        )
