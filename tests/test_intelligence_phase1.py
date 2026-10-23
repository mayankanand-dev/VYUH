"""Unit & Integration Tests for Phase 1: Foundation & Preprocessing (Developer 2)."""

import json
import unittest
from intelligence.language import detect_language
from intelligence.models import AnalysisResult, DerivedNLPFeatures
from intelligence.preprocessing import preprocess_record


class TestPhase1(unittest.TestCase):
    def test_language_detection(self):
        cases = [
            ("Farmers gather at Singhu border for protest", "en", "Latin"),
            ("किसानों ने दिल्ली चलो का नारा दिया", "hi", "Devanagari"),
            ("Kisaan andolan zindabad sarkar kanoon wapas le", "hi-Latn", "Latin"),
            ("Россия выразила озабоченность ситуацией", "ru", "Cyrillic"),
        ]
        for text, exp_lang, exp_script in cases:
            lang, conf, script = detect_language(text)
            self.assertEqual(lang, exp_lang, f"Failed for text: {text}")
            self.assertEqual(script, exp_script, f"Failed script for text: {text}")

    def test_non_mutating_preprocessing(self):
        rec = {
            "record_id": "test_001",
            "text": "Check https://t.co/xyz #FarmersProtest NOW! @user",
            "hashtags": ["FarmersProtest"],
        }
        feat = preprocess_record(rec)
        self.assertEqual(rec["text"], "Check https://t.co/xyz #FarmersProtest NOW! @user")
        self.assertNotIn("https://t.co/xyz", feat.nlp_cleaned_text)
        self.assertEqual(feat.record_id, "test_001")

    def test_fixture_preprocessing(self):
        with open("data/normalized/canonical_fixture_1000.jsonl", "r", encoding="utf-8") as f:
            count = 0
            for line in f:
                rec = json.loads(line)
                feat = preprocess_record(rec)
                self.assertIsNotNone(feat.nlp_cleaned_text)
                count += 1
                if count >= 100:
                    break
            self.assertEqual(count, 100)


if __name__ == "__main__":
    unittest.main()
