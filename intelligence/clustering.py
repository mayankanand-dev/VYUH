"""Narrative Topic Clustering Subsystem for VYUH (Developer 2).

Conforms strictly to Section 4.B and Section 5 of OSINT_Disinfo_Team_README_Final.md.
Uses dense sentence embeddings with HDBSCAN / Agglomerative clustering to discover
unsupervised narrative campaigns, extract representative exemplar posts, and generate
analyst-readable c-TF-IDF keyword summaries.
"""

from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np

from sklearn.cluster import HDBSCAN, AgglomerativeClustering
from sklearn.feature_extraction.text import TfidfVectorizer

from intelligence.models import AnalysisResult, NarrativeCluster, ScoreTypeEnum


class NarrativeClusterEngine:
    """
    Unsupervised narrative discovery engine using density-based clustering (HDBSCAN)
    over L2-normalized multilingual embeddings.
    """
    def __init__(
        self,
        min_cluster_size: int = 5,
        min_samples: int = 2,
        cluster_selection_epsilon: float = 0.35,
        algorithm: str = "hdbscan"
    ):
        self.min_cluster_size = min_cluster_size
        self.min_samples = min_samples
        self.cluster_selection_epsilon = cluster_selection_epsilon
        self.algorithm = algorithm

    def cluster_embeddings(
        self,
        embeddings: np.ndarray,
        metric: str = "euclidean"
    ) -> np.ndarray:
        """
        Executes clustering over dense vectors.
        Note: For L2-normalized vectors, Euclidean distance is monotonically equivalent
        to Cosine distance: ||u - v||^2 = 2 - 2*(u . v).
        """
        if len(embeddings) < self.min_cluster_size:
            return np.full(len(embeddings), -1, dtype=int)

        if self.algorithm == "hdbscan":
            try:
                clusterer = HDBSCAN(
                    min_cluster_size=self.min_cluster_size,
                    min_samples=self.min_samples,
                    cluster_selection_epsilon=self.cluster_selection_epsilon,
                    metric=metric,
                    copy=True
                )
                labels = clusterer.fit_predict(embeddings)
                return labels
            except Exception:
                # Fallback to Agglomerative if HDBSCAN encounters edge cases on tiny samples
                pass

        # Robust Agglomerative fallback with distance threshold
        agg = AgglomerativeClustering(
            n_clusters=None,
            distance_threshold=0.85,
            metric="cosine" if metric == "cosine" else "euclidean",
            linkage="average"
        )
        return agg.fit_predict(embeddings)

    def extract_cluster_keywords(
        self,
        cluster_texts: Dict[int, List[str]],
        top_n: int = 6
    ) -> Dict[int, List[str]]:
        """
        Extracts distinctive keywords for each cluster using Class-based TF-IDF (c-TF-IDF).
        Treats all concatenated documents in a cluster as a single class pseudo-document.
        """
        cluster_ids = sorted([cid for cid in cluster_texts.keys() if cid != -1])
        if not cluster_ids:
            return {}

        corpus = [" ".join(cluster_texts[cid]) for cid in cluster_ids]
        
        # Fit TF-IDF across all clusters to find distinguishing terms
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            max_df=0.85,
            min_df=1,
            sublinear_tf=True
        )
        try:
            tfidf_matrix = vectorizer.fit_transform(corpus)
            feature_names = np.array(vectorizer.get_feature_names_out())

            keywords_by_cluster = {}
            for idx, cid in enumerate(cluster_ids):
                row = tfidf_matrix[idx].toarray().flatten()
                top_indices = np.argsort(row)[::-1][:top_n]
                keywords = [feature_names[i] for i in top_indices if row[i] > 0]
                keywords_by_cluster[cid] = keywords
            return keywords_by_cluster
        except Exception:
            # Fallback to simple frequency if TF-IDF fails on tiny vocabularies
            keywords_by_cluster = {}
            for cid in cluster_ids:
                words = [w for t in cluster_texts[cid] for w in t.lower().split() if len(w) > 3]
                common = [item[0] for item in Counter(words).most_common(top_n)]
                keywords_by_cluster[cid] = common
            return keywords_by_cluster

    def find_representative_posts(
        self,
        cluster_indices: List[int],
        embeddings: np.ndarray,
        record_ids: List[str],
        top_k: int = 3
    ) -> List[str]:
        """
        Finds the exemplar posts closest to the cluster centroid (medoids).
        """
        if not cluster_indices:
            return []

        sub_embeddings = embeddings[cluster_indices]
        centroid = np.mean(sub_embeddings, axis=0, keepdims=True)
        # Cosine similarity to centroid
        norms = np.linalg.norm(sub_embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        norm_sub = sub_embeddings / norms

        c_norm = np.linalg.norm(centroid)
        if c_norm > 0:
            centroid = centroid / c_norm

        sims = np.dot(norm_sub, centroid.T).flatten()
        sorted_indices = np.argsort(sims)[::-1][:top_k]
        return [record_ids[cluster_indices[i]] for i in sorted_indices]

    def discover_narratives(
        self,
        record_ids: List[str],
        texts: List[str],
        embeddings: np.ndarray,
        hashtags_list: Optional[List[List[str]]] = None,
        timestamps: Optional[List[Optional[str]]] = None,
        languages: Optional[List[str]] = None
    ) -> Tuple[List[NarrativeCluster], np.ndarray]:
        """
        Main pipeline method: runs clustering, extracts exemplar posts, c-TF-IDF keywords,
        top hashtags, and returns populated NarrativeCluster models alongside raw cluster labels.
        """
        assert len(record_ids) == len(texts) == len(embeddings), "Input lengths must match"

        labels = self.cluster_embeddings(embeddings)
        unique_labels = set(labels)

        # Group data by cluster label
        cluster_indices = defaultdict(list)
        cluster_texts = defaultdict(list)
        cluster_hashtags = defaultdict(list)
        cluster_times = defaultdict(list)
        cluster_langs = defaultdict(list)

        for i, cid in enumerate(labels):
            cluster_indices[cid].append(i)
            cluster_texts[cid].append(texts[i])
            if hashtags_list and i < len(hashtags_list):
                cluster_hashtags[cid].extend(hashtags_list[i])
            if timestamps and i < len(timestamps) and timestamps[i]:
                cluster_times[cid].append(timestamps[i])
            if languages and i < len(languages) and languages[i]:
                cluster_langs[cid].append(languages[i])

        # Extract keywords via c-TF-IDF
        keywords_map = self.extract_cluster_keywords(cluster_texts, top_n=6)

        clusters = []
        for cid in sorted(unique_labels):
            if cid == -1:
                # Do not manufacture an artificial narrative for unclustered background noise
                continue

            indices = cluster_indices[cid]
            repr_ids = self.find_representative_posts(indices, embeddings, record_ids, top_k=3)
            top_kw = keywords_map.get(cid, [])
            top_ht = [h for h, _ in Counter(cluster_hashtags[cid]).most_common(5)]
            dom_lang = Counter(cluster_langs[cid]).most_common(1)[0][0] if cluster_langs[cid] else "en"

            times = sorted(cluster_times[cid])
            first_seen = times[0] if times else None
            last_seen = times[-1] if times else None

            # Calculate cohesion: average distance to centroid
            sub_emb = embeddings[indices]
            centroid = np.mean(sub_emb, axis=0)
            cohesion = float(np.mean(np.dot(sub_emb, centroid / max(1e-6, np.linalg.norm(centroid)))))

            title_terms = top_kw[:3] or top_ht[:2] or [f"Cluster_{cid}"]
            name = f"Narrative: {' / '.join(title_terms).title()}"

            clusters.append(
                NarrativeCluster(
                    cluster_id=f"narrative_{cid:02d}",
                    name=name,
                    record_count=len(indices),
                    representative_record_ids=repr_ids,
                    top_keywords=top_kw,
                    top_hashtags=top_ht,
                    dominant_language=dom_lang,
                    first_seen=first_seen,
                    last_seen=last_seen,
                    cohesion_score=round(cohesion, 4)
                )
            )

        return clusters, labels


def cluster_to_analysis_results(
    cluster: NarrativeCluster,
    source_record_ids: List[str]
) -> List[AnalysisResult]:
    """
    Converts a NarrativeCluster into canonical Section 5 AnalysisResults for each member record.
    """
    results = []
    for rid in source_record_ids:
        results.append(
            AnalysisResult(
                entity_id=rid,
                task="narrative_clustering",
                model_or_algorithm="HDBSCAN + Multilingual Dense Embeddings",
                version="1.0",
                label=cluster.cluster_id,
                score=cluster.cohesion_score,
                score_type=ScoreTypeEnum.SIMILARITY.value,
                explanation=[
                    f"Assigned to {cluster.name} ({cluster.record_count} total posts)",
                    f"Salient cluster keywords: {', '.join(cluster.top_keywords)}",
                    f"Top cluster hashtags: {', '.join(cluster.top_hashtags)}" if cluster.top_hashtags else "No hashtags"
                ],
                evidence_record_ids=cluster.representative_record_ids,
                source_urls=[],
                threshold=0.35,
                limitations=[
                    "Unsupervised HDBSCAN grouping reflects semantic and lexical density.",
                    "Clusters are leads for investigation, not autonomous proof of orchestrated disinformation."
                ]
            )
        )
    return results
