from pathlib import Path
from typing import Dict, List, Tuple
import pickle

import numpy as np
from sklearn.cluster import KMeans
from gensim.models import Word2Vec


DEFAULT_SEED_CORPUS = [
    "error database connection timeout retry failed",
    "warning cpu usage high threshold reached",
    "info instance started successfully service healthy",
    "error authentication token expired unauthorized",
    "warning memory usage high garbage collection",
    "info scheduled backup completed",
]


class LogClusterer:
    def __init__(self, models_dir: Path, default_clusters: int = 3) -> None:
        self.models_dir = models_dir
        self.models_dir.mkdir(parents=True, exist_ok=True)

        self.vectorizer_path = self.models_dir / "vectorizer.pkl"
        self.model_path = self.models_dir / "clustering_model.pkl"
        self.default_clusters = default_clusters

        self.vectorizer, self.model = self._load_or_bootstrap()

    def _get_sentence_vectors(self, model: Word2Vec, corpus: List[str]) -> np.ndarray:
        vectors = []
        for line in corpus:
            tokens = [t for t in line.lower().split() if t in model.wv]
            if tokens:
                vectors.append(np.mean([model.wv[t] for t in tokens], axis=0))
            else:
                vectors.append(np.zeros(model.vector_size))
        return np.array(vectors)

    def _bootstrap_default_model(self) -> Tuple[Word2Vec, KMeans]:
        tokenized_corpus = [line.lower().split() for line in DEFAULT_SEED_CORPUS]
        w2v_model = Word2Vec(sentences=tokenized_corpus, vector_size=100, window=5, min_count=1, workers=2)
        
        x_seed = self._get_sentence_vectors(w2v_model, DEFAULT_SEED_CORPUS)
        
        kmeans = KMeans(n_clusters=min(self.default_clusters, len(DEFAULT_SEED_CORPUS)), random_state=42, n_init=10)
        kmeans.fit(x_seed)
        self._persist(w2v_model, kmeans)
        return w2v_model, kmeans

    def _persist(self, vectorizer: Word2Vec, model: KMeans) -> None:
        with self.vectorizer_path.open("wb") as f_vec:
            pickle.dump(vectorizer, f_vec)
        with self.model_path.open("wb") as f_model:
            pickle.dump(model, f_model)

    def _load_or_bootstrap(self) -> Tuple[Word2Vec, KMeans]:
        try:
            with self.vectorizer_path.open("rb") as f_vec:
                vectorizer = pickle.load(f_vec)
            with self.model_path.open("rb") as f_model:
                model = pickle.load(f_model)
            return vectorizer, model
        except Exception:
            return self._bootstrap_default_model()

    def fit_predict(self, logs: List[str]) -> Tuple[np.ndarray, np.ndarray]:
        if not logs:
            return np.array([]), np.array([])

        n_clusters = max(1, min(self.default_clusters, len(logs)))
        
        # Train Word2Vec
        tokenized_logs = [line.lower().split() for line in logs]
        self.vectorizer = Word2Vec(sentences=tokenized_logs, vector_size=100, window=5, min_count=1, workers=2)
        
        x = self._get_sentence_vectors(self.vectorizer, logs)

        self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = self.model.fit_predict(x)

        # Persist latest fitted artifacts so subsequent runs can reuse/update model state.
        self._persist(self.vectorizer, self.model)
        return labels, x

    def cluster_distribution(self, labels: np.ndarray) -> Dict[str, int]:
        distribution: Dict[str, int] = {}
        for label in labels.tolist():
            key = f"Cluster {label}"
            distribution[key] = distribution.get(key, 0) + 1
        return distribution

    def top_terms_per_cluster(self, x_matrix: np.ndarray, labels: np.ndarray, top_n: int = 5) -> Dict[str, List[str]]:
        if x_matrix.shape[0] == 0:
            return {}

        top_terms: Dict[str, List[str]] = {}
        
        # The centroids of KMeans
        centroids = self.model.cluster_centers_

        for cluster_id in sorted(set(labels.tolist())):
            centroid = centroids[cluster_id]
            # Find closest words in Word2Vec space to this centroid
            try:
                similar_words = self.vectorizer.wv.similar_by_vector(centroid, topn=top_n)
                top_terms[f"Cluster {cluster_id}"] = [word for word, score in similar_words]
            except Exception:
                top_terms[f"Cluster {cluster_id}"] = []

        return top_terms
