"""Unit & Integration Tests for Phase 2: Embeddings & Similarity (Developer 2)."""

import unittest
import numpy as np
from intelligence.embeddings import get_embedder
from intelligence.models import DerivedNLPFeatures
from intelligence.similarity import (
    find_exact_duplicates,
    find_lexical_near_duplicates,
    find_semantic_similarities,
)


class TestPhase2(unittest.TestCase):
    def test_dense_embeddings_shape_and_norm(self):
        embedder = get_embedder(engine="auto", n_components=128)
        texts = [
            "Farmers protesting at Delhi borders for legal MSP guarantee.",
            "Singhu border protest sees massive participation of farmers.",
            "Independent report on election infrastructure and cybersecurity.",
        ]
        vecs = embedder.embed_texts(texts)
        self.assertEqual(vecs.shape, (3, 128))
        # Verify L2 normalization
        norms = np.linalg.norm(vecs, axis=1)
        for norm in norms:
            self.assertAlmostEqual(norm, 1.0, places=4)

    def test_multi_tier_similarity(self):
        f1 = DerivedNLPFeatures(
            record_id="r1",
            nlp_cleaned_text="massive farmer protest at delhi borders demanding msp",
            detected_language="en",
            detected_script="Latin",
            tokens=["massive", "farmer", "protest", "delhi", "borders", "demanding", "msp"],
            hashtags=["FarmersProtest"],
        )
        f2 = DerivedNLPFeatures(
            record_id="r2",
            nlp_cleaned_text="massive farmer protest at delhi borders demanding msp",
            detected_language="en",
            detected_script="Latin",
            tokens=["massive", "farmer", "protest", "delhi", "borders", "demanding", "msp"],
            hashtags=["FarmersProtest"],
        )
        f3 = DerivedNLPFeatures(
            record_id="r3",
            nlp_cleaned_text="massive farmer protest at borders demanding msp guarantee",
            detected_language="en",
            detected_script="Latin",
            tokens=["massive", "farmer", "protest", "borders", "demanding", "msp", "guarantee"],
            hashtags=["FarmersProtest"],
        )

        # Exact match
        exact = find_exact_duplicates([f1, f2, f3])
        self.assertEqual(len(exact), 1)
        self.assertEqual(exact[0].similarity_type, "exact")

        # Lexical match
        lexical = find_lexical_near_duplicates([f1, f3], token_threshold=0.60)
        self.assertGreaterEqual(len(lexical), 1)


if __name__ == "__main__":
    unittest.main()
