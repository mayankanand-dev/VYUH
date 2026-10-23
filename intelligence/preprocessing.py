"""Text Preprocessing & NLP Feature Extraction Engine for VYUH (Developer 2).

Preserves canonical record immutability pursuant to ISO/IEC 27037 & Section 63 BSA.
Derives normalized text, language detection, script identification, and tokens
without modifying ground-truth canonical bytes.
"""

import html
import re
from typing import Any, Dict, List, Optional, Tuple, Union

from intelligence.language import detect_language
from intelligence.models import DerivedNLPFeatures

# Regular expressions for entity extraction and cleanup
URL_REGEX = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
HASHTAG_REGEX = re.compile(r"#(\w+)", re.UNICODE)
MENTION_REGEX = re.compile(r"@(\w+)", re.UNICODE)
WHITESPACE_REGEX = re.compile(r"\s+")
PUNCTUATION_REGEX = re.compile(r"[^\w\s#@]", re.UNICODE)


def extract_entities(text: str) -> Tuple[List[str], List[str], List[str]]:
    """Extracts (hashtags, mentions, urls) from text before cleaning."""
    if not text:
        return [], [], []
    hashtags = HASHTAG_REGEX.findall(text)
    mentions = MENTION_REGEX.findall(text)
    urls = URL_REGEX.findall(text)
    return hashtags, mentions, urls


def clean_text_for_nlp(text: str, remove_entities: bool = True) -> str:
    """
    Produces clean, normalized text for embedding models and TF-IDF.
    
    - Unescapes HTML entities (&amp;, &lt;, &gt;)
    - Normalizes unicode whitespace
    - Optionally strips URLs and @handles
    - Preserves words across Devanagari, Cyrillic, Gurmukhi, and Latin
    """
    if not text:
        return ""

    # 1. Unescape HTML artifacts
    cleaned = html.unescape(text)

    # 2. Remove or strip URLs
    cleaned = URL_REGEX.sub(" ", cleaned)

    if remove_entities:
        # Strip user handles
        cleaned = MENTION_REGEX.sub(" ", cleaned)
        # Strip '#' symbol but keep the hashtag token itself
        cleaned = re.sub(r"#(\w+)", r"\1", cleaned)

    # 3. Remove punctuation except word characters and spaces
    cleaned = re.sub(r"[^\w\s]", " ", cleaned, flags=re.UNICODE)

    # 4. Collapse consecutive whitespace
    cleaned = WHITESPACE_REGEX.sub(" ", cleaned).strip()

    return cleaned.lower()


def tokenize(text: str, min_len: int = 2) -> List[str]:
    """Tokenizes cleaned text into word tokens, filtering out single characters."""
    if not text:
        return []
    words = text.split()
    return [w for w in words if len(w) >= min_len and not w.isdigit()]


def preprocess_record(record: Union[Dict[str, Any], Any]) -> DerivedNLPFeatures:
    """
    Processes a single CanonicalRecord into DerivedNLPFeatures.
    
    Accepts either a dict or a Pydantic CanonicalRecord instance.
    Leaves original record.text completely unmutated.
    """
    # Extract fields regardless of whether input is dict or object
    if isinstance(record, dict):
        record_id = record.get("record_id", "unknown_id")
        raw_text = record.get("text") or ""
        declared_lang = record.get("language")
        declared_hashtags = record.get("hashtags") or []
        declared_mentions = record.get("mentions") or []
        declared_urls = record.get("urls") or []
    else:
        record_id = getattr(record, "record_id", "unknown_id")
        raw_text = getattr(record, "text", "") or ""
        declared_lang = getattr(record, "language", None)
        declared_hashtags = getattr(record, "hashtags", []) or []
        declared_mentions = getattr(record, "mentions", []) or []
        declared_urls = getattr(record, "urls", []) or []

    # 1. Extract embedded entities if not already provided
    extracted_hashtags, extracted_mentions, extracted_urls = extract_entities(raw_text)
    all_hashtags = list(dict.fromkeys(declared_hashtags + extracted_hashtags))
    all_mentions = list(dict.fromkeys(declared_mentions + extracted_mentions))
    all_urls = list(dict.fromkeys(declared_urls + extracted_urls))

    # 2. Derive cleaned NLP text
    cleaned_text = clean_text_for_nlp(raw_text)

    # 3. Detect language & script
    lang_code, confidence, script = detect_language(raw_text, declared_language=declared_lang)

    # 4. Tokenize
    tokens = tokenize(cleaned_text)

    return DerivedNLPFeatures(
        record_id=record_id,
        raw_text=raw_text,
        nlp_cleaned_text=cleaned_text,
        detected_language=lang_code,
        language_confidence=confidence,
        detected_script=script,
        tokens=tokens,
        hashtags=all_hashtags,
        mentions=all_mentions,
        urls=all_urls,
        character_count=len(cleaned_text),
        word_count=len(tokens),
        is_duplicate_candidate=False
    )
