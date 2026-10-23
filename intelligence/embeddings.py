"""Multilingual Dense Embeddings Subsystem for VYUH (Developer 2).

Provides dual-engine embedding capabilities:
1. SentenceTransformerEmbedder: Pretrained multilingual transformer
   (sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2) when torch/transformers are loaded.
2. DenseMultilingualLSAEmbedder: High-speed, zero-dependency sublinear TF-IDF + TruncatedSVD
   multilingual dense projection (supports Devanagari, Cyrillic, Gurmukhi, and Latin n-grams)
   for instant offline execution and ultra-fast test fixture validation.

Vectors from both engines are strictly L2-normalized so dot products equal cosine similarity.
"""

import os
from typing import List, Optional, Union
import numpy as np

# Try importing sentence_transformers
_SENTENCE_TRANSFORMERS_AVAILABLE = False
try:
    from sentence_transformers import SentenceTransformer
    _SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    pass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD


class BaseEmbedder:
    """Abstract base class for text embedders."""
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        raise NotImplementedError

    def embed_single(self, text: str) -> np.ndarray:
        return self.embed_texts([text])[0]


class DenseMultilingualLSAEmbedder(BaseEmbedder):
    """
    High-speed multilingual dense semantic embedder using sublinear TF-IDF
    with character n-grams and TruncatedSVD latent semantic projection.
    
    Guarantees L2-normalized unit vectors across Devanagari, Cyrillic, Gurmukhi, and Latin.
    """
    def __init__(self, n_components: int = 128):
        self.n_components = n_components
        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            min_df=2,
            sublinear_tf=True,
            strip_accents=None
        )
        self.svd = TruncatedSVD(n_components=n_components, random_state=42)
        self.is_fitted = False

    def fit(self, texts: List[str]) -> "DenseMultilingualLSAEmbedder":
        """Fits vocabulary and latent semantic space on corpus."""
        valid_texts = [t if t and t.strip() else "empty_record" for t in texts]
        tfidf_matrix = self.vectorizer.fit_transform(valid_texts)
        n_features = tfidf_matrix.shape[1]
        n_samples = tfidf_matrix.shape[0]
        actual_components = max(1, min(self.n_components, n_features - 1, n_samples - 1))
        self.svd = TruncatedSVD(n_components=actual_components, random_state=42)
        self.svd.fit(tfidf_matrix)
        self.is_fitted = True
        return self

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Transforms texts into L2-normalized dense embedding vectors."""
        valid_texts = [t if t and t.strip() else "empty_record" for t in texts]
        if not self.is_fitted:
            self.fit(valid_texts)

        tfidf_matrix = self.vectorizer.transform(valid_texts)
        dense_vectors = self.svd.transform(tfidf_matrix)

        # Pad with zeros if actual fitted components < requested n_components
        if dense_vectors.shape[1] < self.n_components:
            padding = np.zeros((dense_vectors.shape[0], self.n_components - dense_vectors.shape[1]), dtype=dense_vectors.dtype)
            dense_vectors = np.hstack([dense_vectors, padding])

        # L2-normalize
        norms = np.linalg.norm(dense_vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        normalized = dense_vectors / norms
        return normalized.astype(np.float32)



class SentenceTransformerEmbedder(BaseEmbedder):
    """
    Transformer-based multilingual sentence embedder using HuggingFace sentence-transformers.
    """
    def __init__(self, model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        if not _SENTENCE_TRANSFORMERS_AVAILABLE:
            raise RuntimeError("sentence-transformers is not installed in the current environment.")
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

    def embed_texts(self, texts: List[str], batch_size: int = 64) -> np.ndarray:
        valid_texts = [t if t and t.strip() else "" for t in texts]
        embeddings = self.model.encode(
            valid_texts,
            batch_size=batch_size,
            show_progress_bar=False,
            normalize_embeddings=True
        )
        return np.array(embeddings, dtype=np.float32)


def get_embedder(
    engine: str = "auto",
    model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    n_components: int = 128
) -> BaseEmbedder:
    """
    Factory function returning the appropriate embedder.
    
    Args:
        engine: 'auto', 'transformer', or 'lsa'.
        model_name: HuggingFace model identifier for transformer engine.
        n_components: Dimensionality for LSA engine.
    """
    if engine == "transformer":
        return SentenceTransformerEmbedder(model_name=model_name)
    elif engine == "lsa":
        return DenseMultilingualLSAEmbedder(n_components=n_components)
    else:  # auto
        # If explicitly downloaded and cached, use transformer; otherwise instant zero-dependency LSA
        if _SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                from huggingface_hub import try_to_load_from_cache
                cached = try_to_load_from_cache(model_name, "model.safetensors")
                if cached:
                    return SentenceTransformerEmbedder(model_name=model_name)
            except Exception:
                pass
        return DenseMultilingualLSAEmbedder(n_components=n_components)

