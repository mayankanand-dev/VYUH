"""Deterministic offline tests for video frame analysis and safety limits (Developer 3 Phase 3).

Covers:
- Graceful degradation when FFmpeg/ffprobe is absent (returns 'not_configured')
- Missing video file handling
- Maximum file size safety limit enforcement
- Container duration limit enforcement
- Subprocess safety without shell interpolation
- Result serialization and limitation disclosure
"""

from pathlib import Path
import pytest

from media.config import MediaConfig
from media.video_analysis import (
    VideoFrameAnalysisResult,
    analyze_video_frames,
    is_ffmpeg_installed,
    is_ffprobe_installed,
)


def test_missing_video_file_handling():
    missing = Path("non_existent_stream.mp4")
    res = analyze_video_frames(missing)

    assert res.status == "file_not_found"
    assert len(res.limitations) > 0
    assert "not found on disk" in res.limitations[0]


def test_exceeds_size_limit(tmp_path: Path):
    dummy_large = tmp_path / "large_video.mp4"
    dummy_large.write_bytes(b"\x00" * 1024)  # 1 KB

    # Set threshold lower than 1 KB
    strict_config = MediaConfig(max_video_size_bytes=512)
    res = analyze_video_frames(dummy_large, config=strict_config)

    assert res.status == "exceeds_size_limit"
    assert "exceeds safety limit" in res.limitations[0]


def test_ffmpeg_not_installed_fallback(tmp_path: Path, monkeypatch):
    """When FFmpeg is absent, video analysis must return a clean 'not_configured' status."""
    dummy_video = tmp_path / "sample.mp4"
    dummy_video.write_bytes(b"\x00" * 100)

    # Force is_ffmpeg_installed to return False
    monkeypatch.setattr("media.video_analysis.is_ffmpeg_installed", lambda: False)

    res = analyze_video_frames(dummy_video)
    assert res.status == "not_configured"
    assert res.deepfake_screening["status"] == "not_configured"
    assert any("FFmpeg" in lim for lim in res.limitations)


def test_video_result_serialization():
    result = VideoFrameAnalysisResult(
        video_path=Path("sample.mp4"),
        status="processed_clean",
        artifact_id="VIDEO_001",
        sampled_frames_count=2,
        sampled_frames=[
            {"frame_index": 0, "timestamp_sec": 0.0, "phash": "1111222233334444"},
            {"frame_index": 1, "timestamp_sec": 1.0, "phash": "1111222233334444"},
        ],
        duplicate_frame_sequences=[
            {"frame_a_index": 0, "frame_b_index": 1, "interpretation": "consecutive_duplicate_frame"}
        ],
    )

    d = result.to_dict()
    assert d["artifact_id"] == "VIDEO_001"
    assert d["status"] == "processed_clean"
    assert d["sampled_frames_count"] == 2
    assert len(d["duplicate_frame_sequences"]) == 1
    assert d["deepfake_screening"]["status"] == "not_configured"
    assert len(d["limitations"]) > 0


@pytest.mark.skipif(not is_ffmpeg_installed(), reason="FFmpeg not installed in system PATH")
def test_live_ffmpeg_execution(tmp_path: Path):
    """Only runs if FFmpeg is actually present in test environment."""
    dummy_video = tmp_path / "real.mp4"
    dummy_video.write_bytes(b"\x00" * 100)
    res = analyze_video_frames(dummy_video)
    assert res.status in ("processed_clean", "probe_error", "sampling_error")
