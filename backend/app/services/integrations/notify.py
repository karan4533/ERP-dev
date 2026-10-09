"""SMTP + WhatsApp delivery. Demo outbox, live providers, or stub when unset."""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

import httpx

from app.core.config import settings
from app.services.integrations import demo

log = logging.getLogger(__name__)


def send_email(*, to: str, subject: str, body: str) -> dict:
    if not settings.smtp_configured:
        return {
            "channel": "email",
            "status": "queued_stub",
            "delivered": False,
            "providerConfigured": False,
            "message": "Not sent — set INTEGRATIONS_MODE=demo or SMTP_HOST/SMTP_FROM",
        }
    if not to or "@" not in to:
        return {
            "channel": "email",
            "status": "failed",
            "delivered": False,
            "providerConfigured": True,
            "message": "Missing or invalid recipient email",
        }

    if settings.demo_integrations:
        demo.append_demo_outbox(
            {
                "channel": "email",
                "to": to,
                "from": settings.smtp_from or demo.DEMO_SMTP_FROM,
                "subject": subject,
                "body": body,
            }
        )
        return {
            "channel": "email",
            "status": "demo_sent",
            "delivered": True,
            "providerConfigured": True,
            "demo": True,
            "message": "Demo SMTP — written to local outbox (not a real mailbox)",
        }

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from
        msg["To"] = to
        msg.set_content(body)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(msg)
        return {
            "channel": "email",
            "status": "sent",
            "delivered": True,
            "providerConfigured": True,
            "message": "SMTP accepted message",
        }
    except Exception as exc:  # noqa: BLE001
        log.warning("smtp_send_failed")
        return {
            "channel": "email",
            "status": "failed",
            "delivered": False,
            "providerConfigured": True,
            "message": f"SMTP error: {type(exc).__name__}",
        }


def send_whatsapp(*, to_phone: str, text: str) -> dict:
    if not settings.whatsapp_configured:
        return {
            "channel": "whatsapp",
            "status": "queued_stub",
            "delivered": False,
            "providerConfigured": False,
            "message": "Not sent — set INTEGRATIONS_MODE=demo or WHATSAPP_API_*",
        }
    if not to_phone:
        return {
            "channel": "whatsapp",
            "status": "failed",
            "delivered": False,
            "providerConfigured": True,
            "message": "Missing recipient phone",
        }

    if settings.demo_integrations:
        demo.append_demo_outbox(
            {
                "channel": "whatsapp",
                "to": to_phone,
                "from": settings.whatsapp_from or demo.DEMO_WHATSAPP_FROM,
                "text": text,
            }
        )
        return {
            "channel": "whatsapp",
            "status": "demo_sent",
            "delivered": True,
            "providerConfigured": True,
            "demo": True,
            "message": "Demo WhatsApp — written to local outbox (not a real WhatsApp send)",
        }

    payload = {
        "to": to_phone,
        "from": settings.whatsapp_from or None,
        "text": text,
    }
    try:
        response = httpx.post(
            settings.whatsapp_api_url,
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.whatsapp_api_token}",
                "Content-Type": "application/json",
            },
            timeout=20,
        )
        if response.status_code >= 400:
            return {
                "channel": "whatsapp",
                "status": "failed",
                "delivered": False,
                "providerConfigured": True,
                "message": f"Provider HTTP {response.status_code}",
            }
        return {
            "channel": "whatsapp",
            "status": "sent",
            "delivered": True,
            "providerConfigured": True,
            "message": "Provider accepted message",
        }
    except Exception as exc:  # noqa: BLE001
        log.warning("whatsapp_send_failed")
        return {
            "channel": "whatsapp",
            "status": "failed",
            "delivered": False,
            "providerConfigured": True,
            "message": f"WhatsApp error: {type(exc).__name__}",
        }
