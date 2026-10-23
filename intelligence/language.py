"""Multilingual Language & Script Detection Subsystem for VYUH (Developer 2).

Supports detection and classification of:
- English ('en')
- Hindi in Devanagari script ('hi')
- Hinglish / Romanized Hindi ('hi-Latn')
- Russian in Cyrillic script ('ru')
- Punjabi in Gurmukhi script ('pa')
- Undetermined ('und') for emoji-only, handles-only, or link-only texts.
"""

import re
import unicodedata
from typing import Dict, Tuple

# Unicode script ranges
DEVANAGARI_REGEX = re.compile(r"[\u0900-\u097F]")
CYRILLIC_REGEX = re.compile(r"[\u0400-\u04FF]")
GURMUKHI_REGEX = re.compile(r"[\u0A00-\u0A7F]")
LATIN_REGEX = re.compile(r"[A-Za-z]")

# Common Hinglish / Romanized Hindi lexemes and morphs (case-insensitive)
HINGLISH_VOCABULARY = {
    # Pronouns & determiners
    "hum", "humare", "aap", "aapke", "mera", "meri", "mere", "tera", "teri", "tere",
    "yeh", "ye", "woh", "wo", "kuch", "sab", "koi",
    # Verbs & auxiliaries
    "hai", "hain", "tha", "thi", "the", "hoga", "hogi", "hoge", "karo", "karna", "kiya",
    "raha", "rahi", "rahe", "gaya", "gayi", "gaye", "bolo", "dekho", "samjho",
    # Conjunctions, prepositions & adverbs
    "aur", "ya", "par", "lekin", "magar", "bhi", "toh", "to", "matlab",
    "ka", "ki", "ke", "ko", "se", "mein", "me", "ne", "tak", "saath",
    "nahi", "nahin", "na", "kyun", "kyu", "kya", "kaise", "kab", "kahan", "yahan", "wahan",
    # Disinformation & Protest-specific lexicon
    "kisaan", "kisan", "morcha", "sarkar", "desh", "jawan", "ekta", "zindabad",
    "dharna", "andolan", "dalal", "godi", "media", "kanoon", "hakk", "inquilab",
    "bharat", "hindustan", "modi", "yogi", "bjp", "congress", "police", "prashasan"
}

# English common functional stopwords for contrast
ENGLISH_STOPWORDS = {
    "the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "for", "of",
    "it", "with", "as", "by", "that", "this", "from", "are", "be", "was", "were",
    "have", "has", "had", "they", "we", "you", "he", "she", "his", "her", "their",
    "our", "my", "your", "will", "would", "can", "could", "should", "not", "but"
}


def clean_text_for_detection(text: str) -> str:
    """Removes URLs, mentions, and standalone symbols before detecting language."""
    if not text:
        return ""
    # Strip URLs
    text = re.sub(r"https?://\S+|www\.\S+", "", text)
    # Strip user handles
    text = re.sub(r"@\w+", "", text)
    # Strip extra whitespace
    return " ".join(text.split())


def detect_script(text: str) -> Tuple[str, Dict[str, int]]:
    """
    Identifies the dominant writing script based on character unicode blocks.
    Returns (dominant_script, counts_dict).
    """
    counts = {
        "Latin": len(LATIN_REGEX.findall(text)),
        "Devanagari": len(DEVANAGARI_REGEX.findall(text)),
        "Cyrillic": len(CYRILLIC_REGEX.findall(text)),
        "Gurmukhi": len(GURMUKHI_REGEX.findall(text)),
    }
    total_letters = sum(counts.values())
    if total_letters == 0:
        return "None", counts

    dominant = max(counts, key=counts.get)
    return dominant, counts


def detect_language(text: str, declared_language: str = None) -> Tuple[str, float, str]:
    """
    Determines the language of a given text.
    
    Args:
        text: The post or message content.
        declared_language: Platform-provided language hint if available.
        
    Returns:
        Tuple of (language_code, confidence, script_name)
        - 'en': English
        - 'hi': Hindi (Devanagari)
        - 'hi-Latn': Hinglish / Romanized Hindi
        - 'ru': Russian (Cyrillic)
        - 'pa': Punjabi (Gurmukhi)
        - 'und': Undetermined
    """
    if not text or not text.strip():
        return "und", 0.0, "None"

    cleaned = clean_text_for_detection(text)
    dominant_script, script_counts = detect_script(cleaned)
    total_alpha = sum(script_counts.values())

    # If there are fewer than 3 alphabetic characters, text is undetermined
    if total_alpha < 3:
        if declared_language and declared_language.lower() in ("en", "english"):
            return "en", 0.5, "Latin"
        if declared_language and declared_language.lower() in ("ru", "russian"):
            return "ru", 0.5, "Cyrillic"
        return "und", 0.0, dominant_script

    # 1. Non-Latin unambiguous scripts
    if dominant_script == "Devanagari":
        confidence = min(1.0, script_counts["Devanagari"] / total_alpha)
        return "hi", round(confidence, 3), "Devanagari"

    if dominant_script == "Cyrillic":
        confidence = min(1.0, script_counts["Cyrillic"] / total_alpha)
        return "ru", round(confidence, 3), "Cyrillic"

    if dominant_script == "Gurmukhi":
        confidence = min(1.0, script_counts["Gurmukhi"] / total_alpha)
        return "pa", round(confidence, 3), "Gurmukhi"

    # 2. Latin script: Disambiguate English vs Hinglish
    tokens = [re.sub(r"[^\w]", "", w.lower()) for w in cleaned.split()]
    tokens = [t for t in tokens if t and not t.isdigit()]

    if not tokens:
        return "und", 0.0, dominant_script

    hinglish_matches = sum(1 for t in tokens if t in HINGLISH_VOCABULARY)
    english_matches = sum(1 for t in tokens if t in ENGLISH_STOPWORDS)

    # Check for strong Hinglish signal
    if hinglish_matches > 0 and hinglish_matches >= english_matches:
        confidence = min(1.0, 0.5 + (hinglish_matches / len(tokens)))
        return "hi-Latn", round(confidence, 3), "Latin"

    # Declared language hint fallback
    if declared_language:
        decl = declared_language.lower()
        if decl in ("ru", "russian"):
            return "ru", 0.9, dominant_script
        if decl in ("hi", "hindi"):
            return "hi", 0.9, dominant_script

    # Standard English default for Latin text
    if english_matches > 0 or dominant_script == "Latin":
        confidence = min(1.0, 0.6 + (english_matches / max(1, len(tokens))))
        return "en", round(confidence, 3), "Latin"

    return "und", 0.3, dominant_script
