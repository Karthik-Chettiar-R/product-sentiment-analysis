from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore


_CREDENTIALS_PATH = (
    Path(__file__).resolve().parent
    / "sentiment-analysis-484f4-firebase-adminsdk-fbsvc-3143dc7521.json"
)

try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app(
        credentials.Certificate(str(_CREDENTIALS_PATH))
    )

db = firestore.client()
