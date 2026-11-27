"""AskEva WhatsApp Business API client (https://backend.askeva.io)."""

from __future__ import annotations

import logging
from urllib.parse import urlencode

import httpx

log = logging.getLogger(__name__)

DEFAULT_SEND_URL = "https://backend.askeva.io/v1/message/send-message"


def normalize_phone(raw: str) -> str:
    """Return digits-only E.164-ish number (India default 91 when 10 digits)."""
    digits = "".join(ch for ch in str(raw or "") if ch.isdigit())
    if digits.startswith("0") and not digits.startswith("00"):
        digits = digits[1:]
    if len(digits) == 10:
        return f"91{digits}"
    return digits


def is_askeva_url(url: str) -> bool:
    return "askeva" in str(url or "").strip().lower()


def build_send_url(api_url: str, token: str) -> str:
    base = (api_url or DEFAULT_SEND_URL).strip().rstrip("?")
    if "token=" in base:
        return base
    sep = "&" if "?" in base else "?"
    return f"{base}{sep}{urlencode({'token': token})}"


def text_payload(*, to_phone: str, body: str) -> dict:
    return {
        "to": normalize_phone(to_phone),
        "type": "text",
        "text": {"body": str(body or "").strip()},
    }


def template_payload(
    *,
    to_phone: str,
    template_name: str,
    language_code: str = "en",
    body_params: list[str] | None = None,
) -> dict:
    components = []
    params = [str(p) for p in (body_params or []) if str(p).strip() != ""]
    if params:
        components.append(
            {
                "type": "body",
                "parameters": [{"type": "text", "text": p} for p in params],
            }
        )
    return {
        "to": normalize_phone(to_phone),
        "type": "template",
        "template": {
            "language": {"policy": "deterministic", "code": language_code or "en"},
            "name": template_name,
            "components": components,
        },
    }


def send_message(
    *,
    api_url: str,
    token: str,
    to_phone: str,
    text: str,
    template_name: str | None = None,
    template_language: str = "en",
    template_params: list[str] | None = None,
    timeout: float = 20,
) -> httpx.Response:
    """POST a text or approved template message to AskEva."""
    phone = normalize_phone(to_phone)
    if not phone:
        raise ValueError("missing_recipient_phone")
    if template_name:
        payload = template_payload(
            to_phone=phone,
            template_name=template_name,
            language_code=template_language,
            body_params=template_params or [text],
        )
    else:
        payload = text_payload(to_phone=phone, body=text)
    url = build_send_url(api_url, token)
    return httpx.post(
        url,
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=timeout,
    )
