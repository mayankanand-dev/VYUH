"""End-to-End Content & Narrative Intelligence Orchestrator for VYUH (Developer 2).

Integrates all 5 intelligence phases into a unified streaming CLI pipeline:
1. Multilingual text preprocessing and language identification
2. Dense vector embeddings (LSA & Transformer)
3. Multi-tier similarity matching (exact, lexical, semantic)
4. HDBSCAN narrative clustering and temporal growth velocity
5. Factual claim extraction and NLI evidence verification
6. Meme and attachment OCR processing
7. Model persistence (models/) and dashboard dataset export (data/intelligence/)

Usage:
    python -m intelligence.run_intelligence --input data/normalized/canonical_fixture_1000.jsonl --output data/intelligence/ --save-models models/
"""

import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, List

import joblib
import numpy as np

from intelligence.clustering import NarrativeClusterEngine, cluster_to_analysis_results
from intelligence.claim_extraction import ClaimExtractor, claim_to_analysis_result
from intelligence.claim_verification import NLIVerifier, verification_to_analysis_result
from intelligence.embeddings import DenseMultilingualLSAEmbedder, get_embedder
from intelligence.media_text.ocr import MemeOCREngine, ocr_to_analysis_result
from intelligence.models import AnalysisResult, DerivedNLPFeatures, NarrativeCluster, SimilarityMatch
from intelligence.narrative_metrics import NarrativeVelocityEngine
from intelligence.preprocessing import preprocess_record
from intelligence.similarity import (
    find_exact_duplicates,
    find_lexical_near_duplicates,
    find_semantic_similarities,
    match_to_analysis_result
)


def run_pipeline(
    input_file: str,
    output_dir: str = "data/intelligence",
    models_dir: str = "models",
    limit: int = None,
    engine_type: str = "auto"
) -> Dict[str, Any]:
    """
    Executes the full Content & Narrative Intelligence pipeline.
    """
    start_time = time.time()
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    print(f"\n{'='*70}")
    print(f"VYUH Content & Narrative Intelligence Pipeline (Developer 2)")
    print(f"Input:       {input_file}")
    print(f"Output:      {output_dir}")
    print(f"Models:      {models_dir}")
    print(f"{'='*70}\n")

    # -------------------------------------------------------------
    # Step 1: Ingestion & Non-destructive NLP Preprocessing
    # -------------------------------------------------------------
    print("[1/6] Ingesting and preprocessing canonical stream...")
    features_list: List[DerivedNLPFeatures] = []
    raw_records: List[Dict[str, Any]] = []

    with open(input_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            feat = preprocess_record(record)
            features_list.append(feat)
            raw_records.append(record)
            if limit and len(features_list) >= limit:
                break

    n_records = len(features_list)
    print(f"      Processed {n_records:,} canonical records.")

    record_ids = [feat.record_id for feat in features_list]
    cleaned_texts = [feat.nlp_cleaned_text for feat in features_list]
    timestamps = [r.get("created_at") for r in raw_records]
    hashtags_list = [feat.hashtags for feat in features_list]
    languages = [feat.detected_language for feat in features_list]

    # -------------------------------------------------------------
    # Step 2: Dense Multilingual Embeddings
    # -------------------------------------------------------------
    print("[2/6] Generating dense multilingual vector representations...")
    embedder = get_embedder(engine=engine_type, n_components=128)
    embeddings = embedder.embed_texts(cleaned_texts)
    print(f"      Generated embedding matrix: {embeddings.shape} (L2-normalized).")

    # Persist fitted embedder
    if isinstance(embedder, DenseMultilingualLSAEmbedder):
        embedder_path = os.path.join(models_dir, "lsa_embedder.joblib")
        joblib.dump(embedder, embedder_path)
        print(f"      Saved embedder model -> {embedder_path}")

    # -------------------------------------------------------------
    # Step 3: Multi-Tier Similarity Engine
    # -------------------------------------------------------------
    print("[3/6] Running multi-tier similarity matching...")
    exact_matches = find_exact_duplicates(features_list)
    lexical_matches = find_lexical_near_duplicates(features_list, token_threshold=0.80, ngram_threshold=0.75)
    semantic_matches = find_semantic_similarities(record_ids, embeddings, threshold=0.88, top_k=3)

    all_matches = exact_matches + lexical_matches + semantic_matches
    print(f"      Exact duplicates:     {len(exact_matches):,} pairs")
    print(f"      Lexical near-dupes:   {len(lexical_matches):,} pairs")
    print(f"      Semantic matches:     {len(semantic_matches):,} pairs")
    print(f"      Total duplicate ties: {len(all_matches):,} pairs")

    # -------------------------------------------------------------
    # Step 4: Narrative Clustering & Temporal Growth Velocity
    # -------------------------------------------------------------
    print("[4/6] Executing unsupervised narrative topic clustering (HDBSCAN)...")
    cluster_engine = NarrativeClusterEngine(
        min_cluster_size=6,
        min_samples=2,
        cluster_selection_epsilon=0.40,
        algorithm="hdbscan"
    )
    clusters, cluster_labels = cluster_engine.discover_narratives(
        record_ids=record_ids,
        texts=cleaned_texts,
        embeddings=embeddings,
        hashtags_list=hashtags_list,
        timestamps=timestamps,
        languages=languages
    )

    noise_count = int(np.sum(cluster_labels == -1))
    print(f"      Discovered {len(clusters)} narrative storylines.")
    print(f"      Unclustered background chatter (noise): {noise_count:,} records.")

    # Persist clustering engine
    cluster_model_path = os.path.join(models_dir, "hdbscan_clusterer.joblib")
    joblib.dump(cluster_engine, cluster_model_path)
    print(f"      Saved clustering engine -> {cluster_model_path}")

    # Temporal velocity analysis
    velocity_engine = NarrativeVelocityEngine(bucket_freq="daily", surge_std_multiplier=1.5)
    all_surge_results = []
    for c in clusters:
        c_rids = [record_ids[i] for i, l in enumerate(cluster_labels) if l == int(c.cluster_id.split("_")[1])]
        c_times = [timestamps[i] for i, l in enumerate(cluster_labels) if l == int(c.cluster_id.split("_")[1])]
        t_data = velocity_engine.compute_timeline(c.cluster_id, c_times, c_rids)
        surges = velocity_engine.generate_surge_analysis_results(t_data)
        all_surge_results.extend(surges)

    print(f"      Calculated timelines: {len(all_surge_results)} volume surges flagged.")

    # -------------------------------------------------------------
    # Step 5: Factual Claim Extraction & NLI Verification
    # -------------------------------------------------------------
    print("[5/6] Extracting factual assertions and evaluating NLI stance...")
    claim_extractor = ClaimExtractor()
    nli_verifier = NLIVerifier()

    extracted_claims = []
    claim_verification_results = []

    for idx, r in enumerate(raw_records):
        text = r.get("text") or ""
        rid = r.get("record_id")
        ts = r.get("created_at")
        claims = claim_extractor.extract_claims_from_text(text, rid, timestamp=ts)
        for c in claims:
            extracted_claims.append(c)
            # Verify claims up to a limit for batch speed
            if len(claim_verification_results) < 50:
                v_res = nli_verifier.verify_claim(c)
                claim_verification_results.append((c, v_res))

    print(f"      Isolated {len(extracted_claims):,} discrete factual claims.")
    print(f"      Verified {len(claim_verification_results)} claims against reference evidence.")

    # -------------------------------------------------------------
    # Step 6: Meme & Media OCR Processing
    # -------------------------------------------------------------
    print("[6/6] Screening media attachments for embedded text...")
    ocr_engine = MemeOCREngine(preferred_engine="auto")
    ocr_analysis_results = []
    media_items_inspected = 0

    for r in raw_records:
        media_refs = r.get("media_reference") or []
        if media_refs:
            media_items_inspected += len(media_refs)
            ocr_res_list = ocr_engine.process_media_references(media_refs)
            for ores in ocr_res_list:
                ocr_analysis_results.append(ocr_to_analysis_result(ores, r.get("record_id")))

    print(f"      Inspected {media_items_inspected:,} media attachments ({len(ocr_analysis_results):,} processed).")

    # -------------------------------------------------------------
    # Export Layer: Serialize Canonical JSONL for Dev 1 UI Dashboard
    # -------------------------------------------------------------
    print("\nExporting structured analysis results to disk...")

    # A. Full AnalysisResult JSONL (Section 5 schema)
    all_analysis_results: List[AnalysisResult] = []

    # Similarity results
    for m in all_matches:
        all_analysis_results.append(match_to_analysis_result(m))

    # Cluster results
    for c in clusters:
        c_rids = [record_ids[i] for i, l in enumerate(cluster_labels) if l == int(c.cluster_id.split("_")[1])]
        all_analysis_results.extend(cluster_to_analysis_results(c, c_rids))

    # Velocity surge results
    all_analysis_results.extend(all_surge_results)

    # Claim extraction results
    for c in extracted_claims:
        all_analysis_results.append(claim_to_analysis_result(c))

    # Claim verification results
    for c, v_res in claim_verification_results:
        all_analysis_results.append(verification_to_analysis_result(c, v_res))

    # OCR results
    all_analysis_results.extend(ocr_analysis_results)

    analysis_file = os.path.join(output_dir, "analysis_results.jsonl")
    with open(analysis_file, "w", encoding="utf-8") as out_f:
        for res in all_analysis_results:
            out_f.write(res.model_dump_json() + "\n")
    print(f"  -> {analysis_file} ({len(all_analysis_results):,} records)")

    # B. Narrative Clusters JSONL
    clusters_file = os.path.join(output_dir, "narrative_clusters.jsonl")
    with open(clusters_file, "w", encoding="utf-8") as out_f:
        for c in clusters:
            out_f.write(c.model_dump_json() + "\n")
    print(f"  -> {clusters_file} ({len(clusters):,} clusters)")

    # C. Similarity Matches JSONL
    matches_file = os.path.join(output_dir, "similarity_matches.jsonl")
    with open(matches_file, "w", encoding="utf-8") as out_f:
        for m in all_matches:
            out_f.write(m.model_dump_json() + "\n")
    print(f"  -> {matches_file} ({len(all_matches):,} matches)")

    # D. Verified Claims JSONL
    claims_file = os.path.join(output_dir, "verified_claims.jsonl")
    with open(claims_file, "w", encoding="utf-8") as out_f:
        for c, v_res in claim_verification_results:
            row = {
                "claim": c.model_dump(),
                "verification": v_res.model_dump()
            }
            out_f.write(json.dumps(row) + "\n")
    print(f"  -> {claims_file} ({len(claim_verification_results):,} claims)")

    # Compute execution digest
    elapsed = round(time.time() - start_time, 2)
    summary_data = {
        "status": "COMPLETED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "input_file": input_file,
        "records_processed": n_records,
        "elapsed_seconds": elapsed,
        "clusters_discovered": len(clusters),
        "similarity_matches": len(all_matches),
        "claims_extracted": len(extracted_claims),
        "claims_verified": len(claim_verification_results),
        "media_items_inspected": media_items_inspected,
        "total_analysis_results_emitted": len(all_analysis_results),
        "models_saved": [
            os.path.join(models_dir, "lsa_embedder.joblib"),
            os.path.join(models_dir, "hdbscan_clusterer.joblib")
        ]
    }

    manifest_file = os.path.join(output_dir, "summary_manifest.json")
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)
    print(f"  -> {manifest_file}")

    print(f"\nPipeline successfully completed in {elapsed}s! [OK]")
    return summary_data


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VYUH Content Intelligence Orchestrator (Dev 2)")
    parser.add_argument("--input", default="data/normalized/canonical_fixture_1000.jsonl", help="Input canonical JSONL")
    parser.add_argument("--output", default="data/intelligence", help="Output directory for analysis results")
    parser.add_argument("--save-models", default="models", help="Directory to persist trained models")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of records")
    parser.add_argument("--engine", default="auto", help="Embedding engine (auto, lsa, transformer)")
    args = parser.parse_args()

    run_pipeline(
        input_file=args.input,
        output_dir=args.output,
        models_dir=args.save_models,
        limit=args.limit,
        engine_type=args.engine
    )
