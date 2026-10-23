"""Reporting and serialization utilities for Dev 3 outputs.

Writes versioned JSON and JSONL artifacts to the designated run output directory.
"""

import json
from pathlib import Path
from typing import Any, Dict, Iterable, List
from pydantic import BaseModel


def serialize_item(item: Any) -> Dict[str, Any]:
    """Serialize a Pydantic model or dataclass or dict to a clean JSON-serializable dict."""
    if isinstance(item, BaseModel):
        return item.model_dump(exclude_none=False)
    if hasattr(item, "to_dict") and callable(item.to_dict):
        return item.to_dict()
    if isinstance(item, dict):
        return item
    raise TypeError(f"Object of type {type(item)} is not JSON-serializable")


def write_jsonl(file_path: Path, items: Iterable[Any]) -> int:
    """Write items to a JSONL file, returning count written."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with open(file_path, "w", encoding="utf-8") as f:
        for it in items:
            d = serialize_item(it)
            f.write(json.dumps(d, ensure_ascii=False) + "\n")
            count += 1
    return count


def write_json(file_path: Path, data: Any) -> None:
    """Write data to a formatted JSON file."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        if isinstance(data, BaseModel):
            f.write(data.model_dump_json(indent=2))
        else:
            json.dump(data, f, indent=2, ensure_ascii=False)
