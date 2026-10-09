"""Local demo credentials for Razorpay / SMTP / WhatsApp.

These are NOT production merchant credentials. Delivery is recorded to a local
outbox file so browser/smoke flows can prove the path without school keys.
RFID / eSSL stays disabled until the school confirms.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings

# Public demo key id (safe to show in UI). Secret stays server-side only.
DEMO_RAZORPAY_KEY_ID = "rzp_test_qmis_demo"
DEMO_RAZORPAY_KEY_SECRET = "qmis_demo_razorpay_secret_not_for_prod"
DEMO_SMTP_HOST = "demo.smtp.local"
DEMO_SMTP_FROM = "noreply-demo@qmis.edu"
DEMO_WHATSAPP_URL = "https://demo.whatsapp.local/v1/messages"
DEMO_WHATSAPP_TOKEN = "qmis_demo_whatsapp_token"
DEMO_WHATSAPP_FROM = "QMIS-DEMO"


def demo_integrations_enabled() -> bool:
    return str(settings.integrations_mode or "").strip().lower() == "demo"


def demo_outbox_path() -> Path:
    root = Path(settings.upload_dir)
    root.mkdir(parents=True, exist_ok=True)
    return root / "demo_outbox.jsonl"


def append_demo_outbox(entry: dict) -> None:
    row = {
        **entry,
        "at": datetime.now(timezone.utc).isoformat(),
        "mode": "demo",
    }
    path = demo_outbox_path()
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(row, ensure_ascii=True) + "\n")
