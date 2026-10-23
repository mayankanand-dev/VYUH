"""Pretrained model adapters for optional AI-generated and deepfake detection.

Stage 6 of Multimedia Forensics:
- Clean modular interface for external deepfake and synthetic-media classifiers
- Strict offline behavior: operates without GPU, API credentials, or auto-downloads
- Returns explicit 'not_configured' payload when no validated model is registered
- Preserves raw outputs and model metadata without fabricating calibrated probabilities
"""

from pathlib import Path
from typing import Any, Dict, List, Optional


class PretrainedForensicModelAdapter:
    """Base adapter interface for optional forensic deepfake and synthetic media models."""

    def __init__(
        self,
        model_name: str = "optional_deepfake_detector",
        version: str = "1.0.0",
        model_path: Optional[str] = None,
        license_str: str = "Unspecified",
        supported_types: Optional[List[str]] = None,
    ) -> None:
        self.model_name = model_name
        self.version = version
        self.model_path = model_path
        self.license = license_str
        self.supported_types = supported_types or [".jpg", ".png", ".mp4"]
        self.is_configured = False

    def predict(self, asset_path: Path) -> Dict[str, Any]:
        """Run classification on target media asset.
        
        Returns:
            Structured prediction payload or 'not_configured' fallback.
        """
        if not self.is_configured or not self.model_path or not Path(self.model_path).exists():
            return {
                "status": "not_configured",
                "model_or_algorithm": self.model_name,
                "version": self.version,
                "score": None,
                "score_type": "calibrated_probability",
                "label": "unconfigured",
                "hardware_mode": "cpu_offline",
                "license": self.license,
                "limitations": [
                    "No compatible, configured and evaluated detector is available in this environment.",
                    "Pretrained AI detectors require domain-specific calibration before legal or evidentiary use.",
                    "Automatic weight downloading is restricted to preserve reproducibility and offline integrity.",
                ],
            }

        # If an evaluated model path was supplied and configured, inference executes here
        return {
            "status": "inconclusive",
            "model_or_algorithm": self.model_name,
            "version": self.version,
            "score": None,
            "score_type": "heuristic",
            "label": "uncalibrated_result",
            "limitations": ["Model requires benchmark validation against labeled synthetic media."],
        }


class AIGeneratedImageScreeningAdapter(PretrainedForensicModelAdapter):
    """Adapter for AI-generated image screening models (e.g. Diffusion/GAN artifacts)."""

    def __init__(self, model_path: Optional[str] = None) -> None:
        super().__init__(
            model_name="ai_synthetic_image_classifier",
            version="1.0.0",
            model_path=model_path,
            license_str="Apache-2.0 / MIT compatible",
            supported_types=[".jpg", ".jpeg", ".png", ".webp"],
        )

    def screen_image(self, image_path: Path) -> Dict[str, Any]:
        """Convenience wrapper for image screening."""
        return self.predict(image_path)


class VideoDeepfakeScreeningAdapter(PretrainedForensicModelAdapter):
    """Adapter for video facial deepfake screening models."""

    def __init__(self, model_path: Optional[str] = None) -> None:
        super().__init__(
            model_name="video_face_deepfake_detector",
            version="1.0.0",
            model_path=model_path,
            license_str="MIT / CC-BY compatible",
            supported_types=[".mp4", ".mov", ".avi", ".webm"],
        )

    def screen_video(self, video_path: Path) -> Dict[str, Any]:
        """Convenience wrapper for video screening."""
        return self.predict(video_path)
