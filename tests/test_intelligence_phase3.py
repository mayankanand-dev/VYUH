"""Unit & Integration Tests for Phase 3: Clustering & Velocity (Developer 2)."""

import unittest
import numpy as np
from intelligence.clustering import NarrativeClusterEngine
from intelligence.narrative_metrics import NarrativeVelocityEngine


class TestPhase3(unittest.TestCase):
    def test_clustering_discovery(self):
        engine = NarrativeClusterEngine(min_cluster_size=2, min_samples=1)
        rids = ["r1", "r2", "r3", "r4", "r5", "r6"]
        texts = [
            "msp law demands at singhu border protest",
            "farmers demand legal msp guarantee at singhu border",
            "us election cybersecurity infrastructure report",
            "foreign interference and bot farm indictments in us election",
            "random uncoordinated noise text one",
            "another unique random post text two",
        ]
        from intelligence.embeddings import get_embedder
        emb = get_embedder(n_components=16)
        vecs = emb.embed_texts(texts)

        clusters, labels = engine.discover_narratives(
            record_ids=rids,
            texts=texts,
            embeddings=vecs,
            hashtags_list=[["FarmersProtest"], ["FarmersProtest"], ["Election"], ["Election"], [], []],
            timestamps=["2021-03-01T00:00:00Z"] * 6,
            languages=["en"] * 6
        )
        self.assertIsInstance(clusters, list)
        self.assertEqual(len(labels), 6)

    def test_velocity_metrics(self):
        v_engine = NarrativeVelocityEngine(bucket_freq="daily", surge_std_multiplier=1.0)
        timestamps = [
            "2021-03-01T10:00:00Z",
            "2021-03-01T12:00:00Z",
            "2021-03-02T10:00:00Z",
            "2021-03-03T10:00:00Z",
            "2021-03-03T11:00:00Z",
            "2021-03-03T12:00:00Z",
            "2021-03-03T13:00:00Z",
            "2021-03-03T14:00:00Z",
        ]
        rids = [f"r{i}" for i in range(len(timestamps))]
        t_data = v_engine.compute_timeline("cluster_01", timestamps, rids)
        self.assertIn("buckets", t_data)
        surges = v_engine.detect_velocity_surges(t_data)

        self.assertIsInstance(surges, list)


if __name__ == "__main__":
    unittest.main()
