import os
import importlib
from datetime import datetime
from typing import Any, Dict, List


MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "cloud_logs_db")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "analyses")


_fallback_store: List[Dict[str, Any]] = []


def _get_collection() -> Any:
    try:
        pymongo_module = importlib.import_module("pymongo")
        errors_module = importlib.import_module("pymongo.errors")
        mongo_client = getattr(pymongo_module, "MongoClient")
        pymongo_error = getattr(errors_module, "PyMongoError")

        client = mongo_client(MONGO_URI, serverSelectionTimeoutMS=1500)
        client.admin.command("ping")
        return client[MONGO_DB][MONGO_COLLECTION]
    except Exception:
        return None


def save_analysis(record: Dict[str, Any]) -> Dict[str, Any]:
    payload = {
        "created_at": datetime.utcnow().isoformat(),
        **record,
    }

    collection = _get_collection()
    if collection is None:
        _fallback_store.insert(0, payload)
        return {"storage": "memory", "id": len(_fallback_store)}

    try:
        result = collection.insert_one(payload)
        return {"storage": "mongo", "id": str(result.inserted_id)}
    except Exception:
        _fallback_store.insert(0, payload)
        return {"storage": "memory", "id": len(_fallback_store)}


def get_recent_analyses(limit: int = 10) -> List[Dict[str, Any]]:
    collection = _get_collection()
    if collection is None:
        return _fallback_store[:limit]

    try:
        docs = list(collection.find({}, {"_id": 0}).sort("created_at", -1).limit(limit))
        return docs
    except Exception:
        return _fallback_store[:limit]
