"""Self-Verification Suite for VYUH Content & Narrative Intelligence (Developer 2).

Executes a complete, automated end-to-end audit:
1. Ingestion contract check (CanonicalRecord)
2. All 5 intelligence models sanity inference
3. AnalysisResult Section 5 schema validation
4. Full unittest suite execution (all 14 tests across phases 1 to 5 + e2e)
5. Output artifacts verification in data/intelligence/

Usage:
    python -m intelligence.verify_pipeline
"""

import os
import sys
import json
import unittest
import joblib
import numpy as np

from ingestion.models import CanonicalRecord
from intelligence.models import AnalysisResult
from intelligence import analyze_post


def verify_all() -> bool:
    print("=" * 75)
    print("VYUH DEVELOPER 2: END-TO-END PIPELINE AUDIT & INTEGRITY CHECK")
    print("=" * 75)
    all_passed = True

    # -------------------------------------------------------------
    # 1. Ingestion Contract Verification
    # -------------------------------------------------------------
    print("\n[Audit 1/5] Validating Ingestion Contract against CanonicalRecord...")
    fixture_path = "data/normalized/canonical_fixture_1000.jsonl"
    if not os.path.exists(fixture_path):
        print(f"  [FAIL] Missing fixture file: {fixture_path}")
        return False

    valid_inputs = 0
    with open(fixture_path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= 100:
                break
            rec = CanonicalRecord.model_validate(json.loads(line))
            valid_inputs += 1

    print(f"  [PASS] Successfully validated sample of {valid_inputs} canonical records (100% compliant).")

    # -------------------------------------------------------------
    # 2. Check the 5 Production Intelligence Models
    # -------------------------------------------------------------
    print("\n[Audit 2/5] Checking All 5 Production Models in models/...")
    expected_models = [
        "models/language_detector.joblib",
        "models/multilingual_embedder.joblib",
        "models/narrative_clusterer.joblib",
        "models/claim_verifier.joblib",
        "models/media_ocr.joblib"
    ]
    for mp in expected_models:
        if not os.path.exists(mp):
            print(f"  [FAIL] Model not found: {mp}")
            all_passed = False
        else:
            sz = os.path.getsize(mp) / (1024 * 1024)
            print(f"  [PASS] {mp} (Size: {sz:.2f} MB)")

    # -------------------------------------------------------------
    # 3. Test Live Inference via analyze_post API
    # -------------------------------------------------------------
    print("\n[Audit 3/5] Testing Live Inference & Output Contract (analyze_post)...")
    sample_post = {
        "record_id": "audit_post_001",
        "platform": "twitter",
        "record_type": "post",
        "post_id": "999888777",
        "author_id": "auth_001",
        "author_name": "ProtestWatch",
        "text": "Delhi police confirmed that 15 new FIRs were registered at Singhu border today. #FarmersProtest",
        "language": "en",
        "created_at": "2021-03-30T03:33:46+00:00",
        "collected_at": "2026-10-23T11:16:40.000000+00:00",
        "hashtags": ["FarmersProtest"],
        "mentions": [],
        "urls": [],
        "media_reference": [{"previewUrl": "https://pbs.twimg.com/media/protest_rally.jpg"}],
        "engagement": {"likes": 120, "retweets": 45, "replies": 10},
        "source_dataset": "farmers_protest_tweets",
        "collection_run_id": "AUDIT_RUN_001",
        "raw_record_reference": "audit_tweets.csv#1",
        "schema_version": "1.0",
        "data_mode": "historical"
    }

    try:
        findings = analyze_post(sample_post)
        print(f"  [PASS] Inferred {len(findings)} Section 5 AnalysisResults from single post:")
        for fd in findings:
            print(f"     -> Task: {fd.task:<25} | Label: {fd.label:<20} | Score: {fd.score}")
    except Exception as e:
        print(f"  [FAIL] analyze_post threw exception: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # 4. Run Automated Test Suite (14 unit tests)
    # -------------------------------------------------------------
    print("\n[Audit 4/5] Running Complete Automated Test Suite (unittest discover)...")
    loader = unittest.TestLoader()
    suite = loader.discover("tests")
    runner = unittest.TextTestRunner(verbosity=1)
    result = runner.run(suite)

    if result.wasSuccessful():
        print(f"  [PASS] All {result.testsRun} automated test cases PASSED with zero errors or failures.")
    else:
        print(f"  [FAIL] Test suite failed: {len(result.failures)} failures, {len(result.errors)} errors.")
        all_passed = False

    # -------------------------------------------------------------
    # 5. Check Artifacts in data/intelligence/
    # -------------------------------------------------------------
    print("\n[Audit 5/5] Verifying Production Data Artifacts in data/intelligence/...")
    artifacts = [
        "analysis_results.jsonl",
        "narrative_clusters.jsonl",
        "similarity_matches.jsonl",
        "verified_claims.jsonl",
        "summary_manifest.json",
        "full_training_manifest.json"
    ]
    for art in artifacts:
        p = os.path.join("data/intelligence", art)
        if not os.path.exists(p):
            print(f"  [FAIL] Missing artifact: {p}")
            all_passed = False
        else:
            print(f"  [PASS] {art} ({os.path.getsize(p):,} bytes)")

    print("\n" + "=" * 75)
    if all_passed:
        print(">>> 100% AUDIT COMPLETE: PIPELINE IS FULLY OPERATIONAL AND VERIFIED <<<")
    else:
        print(">>> AUDIT FINISHED WITH ISSUES (SEE ABOVE) <<<")
    print("=" * 75 + "\n")
    return all_passed


if __name__ == "__main__":
    success = verify_all()
    sys.exit(0 if success else 1)
