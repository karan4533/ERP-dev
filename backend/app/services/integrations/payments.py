"""Razorpay intents: demo HMAC, live API, or NOT_CONFIGURED when unset.

Frontend checkout success is never treated as payment proof — only signature
verify (gateway-confirm) or a verified webhook may mark a link PAID.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from uuid import uuid4

import httpx

from app.core.config import settings
from app.services.integrations import demo
from app.services.integrations.statuses import FAILED, MOCK_QUEUED, NOT_CONFIGURED, OPEN, PAID

log = logging.getLogger(__name__)

RAZORPAY_ORDERS = "https://api.razorpay.com/v1/orders"
RAZORPAY_ORDER_PAYMENTS = "https://api.razorpay.com/v1/orders/{order_id}/payments"


def _key_id() -> str:
    if settings.demo_integrations:
        return settings.razorpay_key_id.strip() or demo.DEMO_RAZORPAY_KEY_ID
    return settings.razorpay_key_id.strip()


def _key_secret() -> str:
    if settings.demo_integrations:
        return settings.razorpay_key_secret.strip() or demo.DEMO_RAZORPAY_KEY_SECRET
    return settings.razorpay_key_secret.strip()


def create_payment_intent(*, amount: float, reference: str, student_id: str | None) -> dict:
    """Return gateway intent fields for storage on the finance payment link."""
    provider = str(settings.payment_provider or "").strip().lower()
    # A stub intent is only honoured in development / demo; production treats it as NOT_CONFIGURED.
    if provider == "stub" and (settings.is_development or settings.demo_integrations):
        return {
            "gateway": "stub",
            "status": OPEN,
            "providerConfigured": True,
            "liveVerified": False,
            "providerOrderId": None,
            "url": f"/student/payment/fees-payment?ref={reference}",
            "message": "Stub payment intent (local / test)",
        }
    if not settings.razorpay_configured or provider != "razorpay":
        return {
            "gateway": "stub",
            "status": NOT_CONFIGURED,
            "providerConfigured": False,
            "liveVerified": False,
            "providerOrderId": None,
            "url": f"/student/payment/fees-payment?ref={reference}",
            "message": "NOT_CONFIGURED — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (INTEGRATIONS_MODE=live for real orders)",
        }

    paise = int(round(float(amount) * 100))
    if paise < 100:
        return {
            "gateway": "razorpay",
            "status": FAILED,
            "providerConfigured": True,
            "liveVerified": False,
            "providerOrderId": None,
            "url": None,
            "message": "Amount too small for Razorpay (min ₹1)",
        }

    if settings.demo_integrations:
        order_id = f"order_demo_{uuid4().hex[:14]}"
        demo.append_demo_outbox(
            {
                "channel": "razorpay",
                "event": "order_created",
                "reference": reference,
                "orderId": order_id,
                "amountPaise": paise,
                "studentId": student_id,
            }
        )
        return {
            "gateway": "razorpay",
            "status": OPEN,
            "providerConfigured": True,
            "demo": True,
            "liveVerified": False,
            "mockStatus": MOCK_QUEUED,
            "providerOrderId": order_id,
            "razorpayKeyId": _key_id(),
            "url": f"/student/payment/fees-payment?ref={reference}&order={order_id}",
            "message": "MOCK_QUEUED — demo Razorpay order (local outbox, not a live merchant charge)",
        }

    body = {
        "amount": paise,
        "currency": "INR",
        "receipt": reference[:40],
        "notes": {"studentId": str(student_id or ""), "reference": reference},
    }
    try:
        response = httpx.post(
            RAZORPAY_ORDERS,
            json=body,
            auth=(_key_id(), _key_secret()),
            timeout=20,
        )
        if response.status_code >= 400:
            log.warning("razorpay_order_failed status=%s", response.status_code)
            return {
                "gateway": "razorpay",
                "status": FAILED,
                "providerConfigured": True,
                "liveVerified": False,
                "providerOrderId": None,
                "url": None,
                "message": f"Razorpay HTTP {response.status_code}",
            }
        data = response.json()
        order_id = data.get("id")
        return {
            "gateway": "razorpay",
            "status": OPEN,
            "providerConfigured": True,
            "liveVerified": False,
            "providerOrderId": order_id,
            "razorpayKeyId": _key_id(),
            "url": f"/student/payment/fees-payment?ref={reference}&order={order_id}",
            "message": "Razorpay order created (sandbox/live per key) — await signature confirm or webhook",
        }
    except Exception as exc:  # noqa: BLE001
        log.warning("razorpay_order_error")
        return {
            "gateway": "razorpay",
            "status": FAILED,
            "providerConfigured": True,
            "liveVerified": False,
            "providerOrderId": None,
            "url": None,
            "message": f"Razorpay error: {type(exc).__name__}",
        }


def fetch_captured_payment_for_order(order_id: str) -> dict | None:
    """Ask Razorpay which payment (if any) captured this order — used when Checkout closes without handler."""
    if not order_id or not settings.razorpay_configured:
        return None
    if settings.demo_integrations and str(order_id).startswith("order_demo_"):
        return None
    try:
        response = httpx.get(
            RAZORPAY_ORDER_PAYMENTS.format(order_id=order_id),
            auth=(_key_id(), _key_secret()),
            timeout=20,
        )
        if response.status_code >= 400:
            log.warning("razorpay_order_payments_failed status=%s", response.status_code)
            return None
        items = (response.json() or {}).get("items") or []
        paid = [
            row for row in items
            if str(row.get("status") or "").lower() in {"captured", "authorized"}
        ]
        if not paid:
            return None
        # Prefer captured; otherwise first authorized.
        paid.sort(key=lambda row: 0 if str(row.get("status") or "").lower() == "captured" else 1)
        return paid[0]
    except Exception:  # noqa: BLE001
        log.warning("razorpay_order_payments_error")
        return None


def verify_razorpay_signature(*, order_id: str, payment_id: str, signature: str) -> bool:
    if not settings.razorpay_configured and not settings.demo_integrations:
        return False
    if not order_id or not payment_id or not signature:
        return False
    payload = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(
        _key_secret().encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def verify_webhook_signature(*, body: bytes, signature: str) -> bool:
    """Razorpay webhook HMAC (X-Razorpay-Signature) using RAZORPAY_WEBHOOK_SECRET."""
    secret = (settings.razorpay_webhook_secret or "").strip()
    if not secret:
        return False
    if not signature:
        return False
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature.strip())


def demo_payment_signature(*, order_id: str, payment_id: str) -> str:
    """Helper for smoke/browser demos — uses the effective demo secret."""
    payload = f"{order_id}|{payment_id}".encode()
    return hmac.new(_key_secret().encode(), payload, hashlib.sha256).hexdigest()


def stub_confirm_token() -> str:
    return f"stub-{uuid4().hex[:12]}"


def paid_marker() -> str:
    return PAID
