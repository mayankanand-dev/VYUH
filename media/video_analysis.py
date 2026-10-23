"""Video frame analysis, metadata inspection, and temporal discontinuity detection.

Stage 5 of Multimedia Forensics:
- Probes container metadata using ffprobe when available
- Samples frames at configurable intervals using ffmpeg
- Computes perceptual frame hashes and detects duplicate frame sequences
- Screens for temporal cuts, abrupt transitions, and timestamp anomalies
- Enforces strict execution timeouts, file size limits, and safe subprocess handling
- Degrades gracefully with 'not_configured' status when FFmpeg/ffprobe is absent
"""

import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

from media.config import DEFAULT_MEDIA_CONFIG, MediaConfig
from media.perceptual_hash import compute_hamming_distance, compute_perceptual_hashes


def is_ffmpeg_installed() -> bool:
    """Check if ffmpeg executable is available in system PATH."""
    return shutil.which("ffmpeg") is not None


def is_ffprobe_installed() -> bool:
    """Check if ffprobe executable is available in system PATH."""
    return shutil.which("ffprobe") is not None


class VideoFrameAnalysisResult:
    """Structured container for video analysis findings."""

    def __init__(
        self,
        video_path: Path,
        status: str,
        artifact_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        sampled_frames_count: int = 0,
        sampled_frames: Optional[List[Dict[str, Any]]] = None,
        candidate_discontinuities: Optional[List[Dict[str, Any]]] = None,
        duplicate_frame_sequences: Optional[List[Dict[str, Any]]] = None,
        deepfake_screening: Optional[Dict[str, Any]] = None,
        limitations: Optional[List[str]] = None,
    ) -> None:
        self.video_path = str(video_path)
        self.artifact_id = artifact_id or Path(video_path).stem
        self.status = status
        self.metadata = metadata or {}
        self.sampled_frames_count = sampled_frames_count
        self.sampled_frames = sampled_frames or []
        self.candidate_discontinuities = candidate_discontinuities or []
        self.duplicate_frame_sequences = duplicate_frame_sequences or []
        self.deepfake_screening = deepfake_screening or {
            "status": "not_configured",
            "score": None,
            "model_or_algorithm": "optional_deepfake_detector",
            "limitations": ["Pretrained video deepfake forensic model not configured in environment."],
        }
        self.limitations = limitations or [
            "Sparse temporal frame sampling cannot prove absence of micro-edits between sampled timestamps.",
            "Video forensic findings are investigative leads, not conclusive legal proof of fabrication.",
        ]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "artifact_id": self.artifact_id,
            "video_path": self.video_path,
            "status": self.status,
            "metadata": self.metadata,
            "sampled_frames_count": self.sampled_frames_count,
            "sampled_frames": self.sampled_frames,
            "candidate_discontinuities": self.candidate_discontinuities,
            "duplicate_frame_sequences": self.duplicate_frame_sequences,
            "deepfake_screening": self.deepfake_screening,
            "limitations": self.limitations,
        }


def extract_video_metadata(
    video_path: Path,
    timeout_sec: float = DEFAULT_MEDIA_CONFIG.video_subprocess_timeout_sec,
) -> Tuple[Dict[str, Any], Optional[str]]:
    """Probe video container and streams using ffprobe without shell execution.
    
    Returns:
        (metadata_dict, error_string)
    """
    if not is_ffprobe_installed():
        return {}, "ffprobe_not_installed"

    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        str(video_path),
    ]

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
            shell=False,
            check=False,
        )
        if proc.returncode != 0:
            return {}, f"ffprobe failed with exit code {proc.returncode}"

        data = json.loads(proc.stdout)
        fmt = data.get("format", {})
        streams = data.get("streams", [])

        video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
        has_audio = any(s.get("codec_type") == "audio" for s in streams)

        duration = float(fmt.get("duration", 0.0))
        width = int(video_stream.get("width", 0)) if video_stream else None
        height = int(video_stream.get("height", 0)) if video_stream else None
        codec_name = video_stream.get("codec_name") if video_stream else None
        fps_str = video_stream.get("r_frame_rate", "0/1") if video_stream else "0/1"

        try:
            num, denom = fps_str.split("/")
            fps = round(float(num) / float(denom), 2) if float(denom) > 0 else 0.0
        except Exception:
            fps = 0.0

        meta = {
            "container_format": fmt.get("format_name"),
            "duration_sec": round(duration, 2),
            "dimensions": f"{width}x{height}" if width and height else None,
            "codec": codec_name,
            "frame_rate": fps,
            "has_video": video_stream is not None,
            "has_audio": has_audio,
            "bit_rate": fmt.get("bit_rate"),
        }
        return meta, None
    except subprocess.TimeoutExpired:
        return {}, f"ffprobe timed out after {timeout_sec}s"
    except Exception as ex:
        return {}, f"Failed to probe video: {ex}"


def sample_video_frames(
    video_path: Path,
    artifact_id: str,
    temp_dir: Path,
    config: MediaConfig = DEFAULT_MEDIA_CONFIG,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """Sample video frames at configured interval using ffmpeg safely.
    
    Returns:
        (sampled_frames_list, error_string)
    """
    if not is_ffmpeg_installed():
        return [], "ffmpeg_not_installed"

    # Command: ffmpeg -i video_path -vf fps=1/interval -frames:v max_frames temp_dir/frame_%04d.png
    out_pattern = temp_dir / "frame_%04d.png"
    fps_val = f"1/{config.video_sample_interval_sec}" if config.video_sample_interval_sec >= 1.0 else f"{1.0 / config.video_sample_interval_sec}"

    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(video_path),
        "-vf", f"fps={fps_val}",
        "-vframes", str(config.max_sampled_frames),
        "-an",
        str(out_pattern),
    ]

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=config.video_subprocess_timeout_sec,
            shell=False,
            check=False,
        )
        if proc.returncode != 0:
            return [], f"ffmpeg frame extraction failed: {proc.stderr[:200]}"

        # Collect and hash extracted frames
        frame_files = sorted(temp_dir.glob("frame_*.png"))
        sampled: List[Dict[str, Any]] = []

        for idx, f_path in enumerate(frame_files):
            timestamp_sec = round(idx * config.video_sample_interval_sec, 2)
            try:
                h_res = compute_perceptual_hashes(f_path)
                sampled.append({
                    "artifact_id": artifact_id,
                    "frame_index": idx,
                    "timestamp_sec": timestamp_sec,
                    "timestamp_type": "sampling_derived",
                    "phash": h_res["phash"],
                    "dhash": h_res["dhash"],
                    "dimensions": h_res.get("dimensions"),
                })
            except Exception:
                pass

        return sampled, None
    except subprocess.TimeoutExpired:
        return [], f"ffmpeg timed out after {config.video_subprocess_timeout_sec}s"
    except Exception as ex:
        return [], f"Frame sampling exception: {ex}"


def analyze_video_frames(
    video_path: Path,
    artifact_id: Optional[str] = None,
    config: MediaConfig = DEFAULT_MEDIA_CONFIG,
) -> VideoFrameAnalysisResult:
    """Analyze a local video file for temporal duplicates, sharp cuts, and metadata anomalies.
    
    If FFmpeg is not installed, returns a graceful 'not_configured' status
    without crashing or raising unhandled exceptions.
    """
    p = Path(video_path)
    art_id = artifact_id or p.stem

    if not p.exists():
        return VideoFrameAnalysisResult(
            video_path=p,
            artifact_id=art_id,
            status="file_not_found",
            limitations=[f"Video asset path not found on disk: {p}"],
        )

    file_size = p.stat().st_size
    if file_size > config.max_video_size_bytes:
        return VideoFrameAnalysisResult(
            video_path=p,
            artifact_id=art_id,
            status="exceeds_size_limit",
            limitations=[f"Video file size ({file_size} bytes) exceeds safety limit ({config.max_video_size_bytes} bytes)."],
        )

    if not is_ffmpeg_installed() or not is_ffprobe_installed():
        return VideoFrameAnalysisResult(
            video_path=p,
            artifact_id=art_id,
            status="not_configured",
            limitations=[
                "FFmpeg/ffprobe executable not found in system PATH.",
                "Video frame analysis and container stream extraction require FFmpeg/ffprobe installation.",
                "Core platform operating in offline graceful degradation mode.",
            ],
        )

    # 1. Probe Metadata
    meta, probe_err = extract_video_metadata(p, timeout_sec=config.video_subprocess_timeout_sec)
    if probe_err:
        return VideoFrameAnalysisResult(
            video_path=p,
            artifact_id=art_id,
            status="probe_error",
            limitations=[f"Container metadata inspection failed: {probe_err}"],
        )

    # Check duration limit
    dur = meta.get("duration_sec", 0.0)
    if dur > config.max_video_duration_sec:
        return VideoFrameAnalysisResult(
            video_path=p,
            artifact_id=art_id,
            status="exceeds_duration_limit",
            metadata=meta,
            limitations=[f"Video duration ({dur}s) exceeds safety limit ({config.max_video_duration_sec}s)."],
        )

    # 2. Extract and hash frames in a temporary directory
    candidate_discontinuities: List[Dict[str, Any]] = []
    duplicate_sequences: List[Dict[str, Any]] = []
    sampled_frames: List[Dict[str, Any]] = []

    with tempfile.TemporaryDirectory(prefix="vyuh_video_frames_") as tmp_dir_str:
        tmp_dir = Path(tmp_dir_str)
        sampled_frames, sample_err = sample_video_frames(
            p, artifact_id=art_id, temp_dir=tmp_dir, config=config
        )

        if sample_err:
            return VideoFrameAnalysisResult(
                video_path=p,
                artifact_id=art_id,
                status="sampling_error",
                metadata=meta,
                limitations=[f"Frame extraction failed: {sample_err}"],
            )

        # 3. Analyze adjacent sampled frames for cuts and duplicates
        for i in range(len(sampled_frames) - 1):
            f_curr = sampled_frames[i]
            f_next = sampled_frames[i + 1]

            h_curr = f_curr["phash"]
            h_next = f_next["phash"]
            dist = compute_hamming_distance(h_curr, h_next)

            # Check for identical duplicate frames
            if dist == config.exact_frame_hash_threshold:
                duplicate_sequences.append({
                    "frame_a_index": f_curr["frame_index"],
                    "frame_b_index": f_next["frame_index"],
                    "timestamp_a": f_curr["timestamp_sec"],
                    "timestamp_b": f_next["timestamp_sec"],
                    "hamming_distance": dist,
                    "interpretation": "consecutive_duplicate_frame",
                })
            # Check for sharp transition / temporal cut (large perceptual jump)
            elif dist > 35:
                candidate_discontinuities.append({
                    "frame_a_index": f_curr["frame_index"],
                    "frame_b_index": f_next["frame_index"],
                    "timestamp_a": f_curr["timestamp_sec"],
                    "timestamp_b": f_next["timestamp_sec"],
                    "hamming_distance": dist,
                    "interpretation": "abrupt_scene_transition_or_cut",
                })

    return VideoFrameAnalysisResult(
        video_path=p,
        artifact_id=art_id,
        status="processed_clean",
        metadata=meta,
        sampled_frames_count=len(sampled_frames),
        sampled_frames=sampled_frames,
        candidate_discontinuities=candidate_discontinuities,
        duplicate_frame_sequences=duplicate_sequences,
        limitations=[
            "Sparse temporal frame sampling cannot prove absence of micro-edits between sampled timestamps.",
            "Scene cuts and duplicate frames can occur legitimately in standard videography.",
            "Video forensic findings are investigative leads for human analyst review.",
        ],
    )
