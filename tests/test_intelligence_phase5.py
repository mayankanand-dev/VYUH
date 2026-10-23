"""Unit & Integration Tests for Phase 5: Meme & Media OCR Pipeline (Developer 2)."""

import unittest
from intelligence.media_text.ocr import MemeOCREngine, OCRResult


class TestPhase5(unittest.TestCase):
    def test_ocr_engine_initialization(self):
        engine = MemeOCREngine(preferred_engine="auto")
        self.assertIsNotNone(engine)

    def test_ocr_extraction_provenance(self):
        engine = MemeOCREngine()
        media = {
            "previewUrl": "https://pbs.twimg.com/media/test_meme_image.jpg",
            "type": "image"
        }
        res = engine.extract_text_from_media(media)
        self.assertIsInstance(res, OCRResult)
        # Verify strict evidentiary provenance tag
        self.assertEqual(res.provenance, "ocr_derived_text")
        self.assertEqual(res.artifact_id, "https://pbs.twimg.com/media/test_meme_image.jpg")


if __name__ == "__main__":
    unittest.main()
