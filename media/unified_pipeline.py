"""Unified multimedia analysis orchestrator (backward-compatible adapter).

Re-exports core functions from media.pipeline for seamless interoperability
with existing tests and Dev 3 pipeline stages.
"""

from media.pipeline import analyze_media_asset, run_multimedia_pipeline

__all__ = ["analyze_media_asset", "run_multimedia_pipeline"]
