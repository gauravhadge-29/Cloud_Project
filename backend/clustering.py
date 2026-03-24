from pathlib import Path
from typing import Dict, List, Tuple
import pickle

import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer


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

    def _bootstrap_default_model(self) -> Tuple[TfidfVectorizer, KMeans]:
        vectorizer = TfidfVectorizer(max_features=1500, ngram_range=(1, 2), stop_words="english")
        x_seed = vectorizer.fit_transform(DEFAULT_SEED_CORPUS)
        model = KMeans(n_clusters=min(self.default_clusters, len(DEFAULT_SEED_CORPUS)), random_state=42, n_init=10)
        model.fit(x_seed)
        self._persist(vectorizer, model)
        return vectorizer, model

    def _persist(self, vectorizer: TfidfVectorizer, model: KMeans) -> None:
        with self.vectorizer_path.open("wb") as f_vec:
            pickle.dump(vectorizer, f_vec)
        with self.model_path.open("wb") as f_model:
            pickle.dump(model, f_model)

    def _load_or_bootstrap(self) -> Tuple[TfidfVectorizer, KMeans]:
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
        x = self.vectorizer.fit_transform(logs)

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

        feature_names = self.vectorizer.get_feature_names_out()
        top_terms: Dict[str, List[str]] = {}

        for cluster_id in sorted(set(labels.tolist())):
            cluster_rows = x_matrix[labels == cluster_id]
            mean_weights = np.asarray(cluster_rows.mean(axis=0)).ravel()
            top_idx = mean_weights.argsort()[::-1][:top_n]
            top_terms[f"Cluster {cluster_id}"] = [feature_names[idx] for idx in top_idx if mean_weights[idx] > 0]

        return top_terms
