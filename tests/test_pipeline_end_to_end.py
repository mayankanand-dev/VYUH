"""End-to-End Comprehensive Pipeline Test for VYUH (Developer 2).

Validates the full pipeline from raw CanonicalRecord ingestion through all 5 phases:
1. Ingestion of canonical records
2. Preprocessing & language identification
3. Dense embeddings & multi-tier similarity
4. Narrative clustering & velocity
5. Claim extraction & NLI verification
6. OCR processing
7. Validation against Section 5 AnalysisResult schema
"""

import json
import os
import unittest
from intelligence import analyze_post, run_pipeline
from intelligence.models import AnalysisResult
from ingestion.models import CanonicalRecord


class TestEndToEndPipeline(unittest.TestCase):
    def test_single_post_analyze_api(self):
        sample_post = {
            "record_id": "test_e2e_001",
            "platform": "twitter",
            "record_type": "post",
            "post_id": "1234567890",
            "author_id": "auth_123",
            "author_name": "TestInvestigator",
            "text": "Breaking: Delhi police registered over 25 FIRs against protest leaders today. #FarmersProtest",
            "language": "en",
            "created_at": "2021-03-30T03:33:46+00:00",
            "collected_at": "2026-10-23T11:16:40.000000+00:00",
            "hashtags": ["FarmersProtest"],
            "mentions": [],
            "urls": [],
            "media_reference": [{"previewUrl": "https://pbs.twimg.com/media/protest_rally.jpg"}],
            "engagement": {"likes": 50, "retweets": 12, "replies": 3},
            "source_dataset": "farmers_protest_tweets",
            "collection_run_id": "RUN_TEST_001",
            "raw_record_reference": "sample_tweets.csv#1",
            "schema_version": "1.0",
            "data_mode": "historical"
        }


        # 1. Ingestion contract check
        can_rec = CanonicalRecord.model_validate(sample_post)
        self.assertEqual(can_rec.record_id, "test_e2e_001")

        # 2. Analyze post
        results = analyze_post(sample_post)
        self.assertIsInstance(results, list)
        self.assertGreaterEqual(len(results), 1)

        # 3. Output contract check: Every item MUST validate as AnalysisResult
        for res in results:
            self.assertIsInstance(res, AnalysisResult)
            self.assertEqual(res.entity_id, "test_e2e_001")
            self.assertIsNotNone(res.task)
            self.assertIsNotNone(res.score_type)
            self.assertIsInstance(res.explanation, list)
            self.assertIsInstance(res.evidence_record_ids, list)
            self.assertIsInstance(res.limitations, list)

    def test_batch_pipeline_on_fixture(self):
        output_dir = "data/intelligence/test_run"
        os.makedirs(output_dir, exist_ok=True)

        summary = run_pipeline(
            input_file="data/normalized/canonical_fixture_1000.jsonl",
            output_dir=output_dir,
            models_dir="models",
            limit=50
        )
        self.assertEqual(summary["status"], "COMPLETED")
        self.assertEqual(summary["records_processed"], 50)
        self.assertTrue(os.path.exists(os.path.join(output_dir, "analysis_results.jsonl")))

        # Clean up test output dir
        import shutil
        shutil.rmtree(output_dir, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
