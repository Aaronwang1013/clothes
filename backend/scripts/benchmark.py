#!/usr/bin/env python3
"""
Virtual Try-On API Benchmark Script
====================================
同時測試多個 provider，用相同的測試圖比較速度、品質、成本。

使用方式：
  cd backend
  python scripts/benchmark.py \
    --person scripts/test_images/person.jpg \
    --garment scripts/test_images/garment.jpg \
    --category upper_body \
    --providers replicate fashn kling segmind \
    --output scripts/benchmark_results/

環境變數（在 .env 或 shell export）：
  REPLICATE_API_TOKEN=...
  FASHN_API_KEY=...
  KLING_API_KEY=...
  KLING_API_SECRET=...
  SEGMIND_API_KEY=...
"""

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from app.providers import FashnProvider, KlingProvider, ReplicateProvider, SegmindProvider
from app.providers.base import TryonProvider, TryonResult

PROVIDERS: dict[str, type[TryonProvider]] = {
    "replicate": ReplicateProvider,
    "fashn": FashnProvider,
    "kling": KlingProvider,
    "segmind": SegmindProvider,
}

PROVIDER_INFO = {
    "replicate": {"name": "Replicate IDM-VTON", "cost_per_run": 0.025},
    "fashn":     {"name": "Fashn.ai v1.6",       "cost_per_run": 0.075},
    "kling":     {"name": "Kling AI",             "cost_per_run": 0.070},
    "segmind":   {"name": "Segmind Try-On",       "cost_per_run": 0.040},
}


def run_single(provider_key: str, person_bytes: bytes, garment_bytes: bytes, category: str) -> dict:
    print(f"\n{'='*50}")
    print(f"▶  Testing: {PROVIDER_INFO[provider_key]['name']}")
    print(f"{'='*50}")

    provider = PROVIDERS[provider_key]()
    start = time.perf_counter()

    try:
        result: TryonResult = provider.run(person_bytes, garment_bytes, category)
        elapsed = time.perf_counter() - start
        print(f"✅  Done in {elapsed:.1f}s | Cost: ${result.cost_usd:.4f}")
        return {
            "provider": provider_key,
            "name": PROVIDER_INFO[provider_key]["name"],
            "status": "success",
            "latency_seconds": round(result.latency_seconds, 2),
            "cost_usd": result.cost_usd,
            "image_bytes": result.image_bytes,
        }
    except Exception as e:
        elapsed = time.perf_counter() - start
        print(f"❌  Failed after {elapsed:.1f}s: {e}")
        return {
            "provider": provider_key,
            "name": PROVIDER_INFO[provider_key]["name"],
            "status": "failed",
            "error": str(e),
            "latency_seconds": round(elapsed, 2),
            "cost_usd": 0.0,
            "image_bytes": None,
        }


def save_results(results: list[dict], output_dir: Path) -> None:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = output_dir / ts
    run_dir.mkdir(parents=True, exist_ok=True)

    summary = []
    for r in results:
        image_bytes = r.pop("image_bytes", None)
        summary.append(r)
        if image_bytes:
            img_path = run_dir / f"{r['provider']}_result.jpg"
            img_path.write_bytes(image_bytes)
            print(f"💾  Saved: {img_path}")

    summary_path = run_dir / "summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False))

    print("\n\n" + "="*60)
    print("BENCHMARK SUMMARY")
    print("="*60)
    print(f"{'Provider':<25} {'Status':<10} {'Latency':>10} {'Cost':>10}")
    print("-"*60)
    for r in summary:
        status = r["status"]
        latency = f"{r['latency_seconds']:.1f}s" if status == "success" else "—"
        cost = f"${r['cost_usd']:.4f}" if status == "success" else "—"
        print(f"{r['name']:<25} {status:<10} {latency:>10} {cost:>10}")
    print("-"*60)
    total_cost = sum(r["cost_usd"] for r in summary)
    print(f"\n  Total cost this run: ${total_cost:.4f}")
    print(f"  Results saved to: {run_dir}")


def main():
    parser = argparse.ArgumentParser(description="VTO API Benchmark")
    parser.add_argument("--person",   required=True, help="Path to person image")
    parser.add_argument("--garment",  required=True, help="Path to garment image")
    parser.add_argument("--category", default="upper_body",
                        choices=["upper_body", "lower_body", "dresses"])
    parser.add_argument("--providers", nargs="+", default=list(PROVIDERS.keys()),
                        choices=list(PROVIDERS.keys()))
    parser.add_argument("--output", default=str(Path(__file__).parent / "benchmark_results"))
    args = parser.parse_args()

    person_bytes = Path(args.person).read_bytes()
    garment_bytes = Path(args.garment).read_bytes()
    output_dir = Path(args.output)

    print(f"\n🚀  VTO Benchmark — {len(args.providers)} provider(s)")
    print(f"   Person:   {args.person}")
    print(f"   Garment:  {args.garment}")
    print(f"   Category: {args.category}")
    print(f"   Testing:  {', '.join(args.providers)}")

    results = [run_single(p, person_bytes, garment_bytes, args.category) for p in args.providers]
    save_results(results, output_dir)


if __name__ == "__main__":
    main()
