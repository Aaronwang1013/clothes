from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class TryonResult:
    image_bytes: bytes
    latency_seconds: float
    cost_usd: float
    provider: str


class TryonProvider(ABC):
    """Abstract base for all virtual try-on providers."""

    @abstractmethod
    def run(
        self,
        person_bytes: bytes,
        garment_bytes: bytes,
        category: str,
        garment_description: str = "",
    ) -> TryonResult:
        """
        Run try-on and return image bytes + metadata.
        Raises on failure.
        """
        ...
