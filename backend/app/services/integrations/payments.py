"""Razorpay intents: demo HMAC, live API, or stub when unset."""

from __future__ import annotations

import hashlib
import hmac
import logging
from uuid import uuid4

import httpx

from app.core.config import settings
from app.services.integrations import demo

log = logging.getLogger(__name__)

RAZORPAY_ORDERS = "https://api.razorpay.com/v1/orders"


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
    if not settings.razorpay_configured or settings.payment_provider.lower() != "razorpay":
        return {
            "gateway": "stub",
            "status": "OPEN",
            "providerConfigured": False,
            "providerOrderId": None,
            "url": f"/student/payment/fees-payment?ref={reference}",
            "message": "Stub intent — set INTEGRATIONS_MODE=demo or RAZORPAY_* keys",
        }

    paise = int(round(float(amount) * 100))
    if paise < 100:
        return {
            "gateway": "razorpay",
            "status": "FAILED",
            "providerConfigured": True,
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
            "status": "OPEN",
            "providerConfigured": True,
            "demo": True,
            "providerOrderId": order_id,
            "razorpayKeyId": _key_id(),
            "url": f"/student/payment/fees-payment?ref={reference}&order={order_id}",
            "message": "Demo Razorpay order (local outbox — not a live merchant charge)",
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
                "status": "FAILED",
                "providerConfigured": True,
                "providerOrderId": None,
                "url": None,
                "message": f"Razorpay HTTP {response.status_code}",
            }
        data = response.json()
        order_id = data.get("id")
        return {
            "gateway": "razorpay",
            "status": "OPEN",
            "providerConfigured": True,
            "providerOrderId": order_id,
            "razorpayKeyId": _key_id(),
            "url": f"/student/payment/fees-payment?ref={reference}&order={order_id}",
            "message": "Razorpay order created (sandbox/live per key)",
        }
    except Exception as exc:  # noqa: BLE001
        log.warning("razorpay_order_error")
        return {
            "gateway": "razorpay",
            "status": "FAILED",
            "providerConfigured": True,
            "providerOrderId": None,
            "url": None,
            "message": f"Razorpay error: {type(exc).__name__}",
        }


def verify_razorpay_signature(*, order_id: str, payment_id: str, signature: str) -> bool:
    if not settings.razorpay_configured:
        return False
    payload = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(
        _key_secret().encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def demo_payment_signature(*, order_id: str, payment_id: str) -> str:
    """Helper for smoke/browser demos — uses the effective demo secret."""
    payload = f"{order_id}|{payment_id}".encode()
    return hmac.new(_key_secret().encode(), payload, hashlib.sha256).hexdigest()


def stub_confirm_token() -> str:
    return f"stub-{uuid4().hex[:12]}"
