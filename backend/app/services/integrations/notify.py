"""SMTP + WhatsApp delivery. Demo outbox, live providers, or NOT_CONFIGURED when unset."""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

import httpx

from app.core.config import settings
from app.services.integrations import demo
from app.services.integrations.statuses import DEMO_SENT, FAILED, MOCK_QUEUED, NOT_CONFIGURED, SENT

log = logging.getLogger(__name__)
_delivered_event_keys: set[str] = set()


def _not_configured(channel: str, hint: str) -> dict:
    return {
        "channel": channel,
        "status": NOT_CONFIGURED,
        "legacyStatus": "queued_stub",
        "delivered": False,
        "providerConfigured": False,
        "liveVerified": False,
        "message": hint,
    }


def send_email(
    *,
    to: str,
    subject: str,
    body: str,
    html_body: str | None = None,
) -> dict:
    if not settings.smtp_configured:
        return _not_configured(
            "email",
            "NOT_CONFIGURED — set SMTP_HOST and SMTP_FROM (and INTEGRATIONS_MODE=live for real send)",
        )
    if not to or "@" not in to:
        return {
            "channel": "email",
            "status": FAILED,
            "delivered": False,
            "providerConfigured": True,
            "liveVerified": False,
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
                "html": html_body,
            }
        )
        return {
            "channel": "email",
            "status": MOCK_QUEUED,
            "legacyStatus": DEMO_SENT,
            "delivered": False,
            "providerConfigured": True,
            "demo": True,
            "liveVerified": False,
            "message": "MOCK_QUEUED — written to local outbox (not a real mailbox)",
        }

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from
        msg["To"] = to
        msg.set_content(body)
        if html_body:
            msg.add_alternative(html_body, subtype="html")
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(msg)
        return {
            "channel": "email",
            "status": SENT,
            "delivered": True,
            "providerConfigured": True,
            "liveVerified": True,
            "message": "SMTP accepted message",
        }
    except Exception as exc:  # noqa: BLE001
        log.warning("smtp_send_failed")
        return {
            "channel": "email",
            "status": FAILED,
            "delivered": False,
            "providerConfigured": True,
            "liveVerified": False,
            "message": f"SMTP error: {type(exc).__name__}",
        }


def _whatsapp_failure(detail: str, *, event: str | None = None) -> dict:
    hint = ""
    lowered = detail.lower()
    if "session is not opened" in lowered:
        hint = (
            " Chat session is closed for free-form text. "
            f"Create/approve an AskEva template for event '{event or 'generic'}' "
            "and set the matching WHATSAPP_TEMPLATE_* in backend/.env."
        )
    elif "template is not valid" in lowered:
        hint = " Use an approved AskEva/Meta template name in WHATSAPP_TEMPLATE_*."
    return {
        "channel": "whatsapp",
        "status": FAILED,
        "delivered": False,
        "providerConfigured": True,
        "liveVerified": False,
        "message": (detail or "Provider error") + hint,
        "event": event,
    }


def _askeva_post(*, phone: str, text: str, template_name: str | None, template_params: list[str] | None):
    from app.services.integrations import askeva

    return askeva.send_message(
        api_url=settings.whatsapp_api_url,
        token=settings.whatsapp_api_token,
        to_phone=phone,
        text=text,
        template_name=template_name,
        template_language=settings.whatsapp_template_language or "en",
        template_params=template_params,
    )


def send_whatsapp(
    *,
    to_phone: str,
    text: str,
    event: str | None = None,
    template_name: str | None = None,
    template_params: list[str] | None = None,
    force_template: bool = False,
) -> dict:
    """Send WhatsApp with event-correct body text.

    Prefer free-form text (correct payment / due / result wording). If AskEva rejects
    with session-closed, fall back to the event's approved template when configured.
    Never substitutes a welcome template for fee/result events.
    """
    from app.services.integrations import askeva
    from app.services.integrations.whatsapp_events import template_for_event

    if not settings.whatsapp_configured:
        return _not_configured(
            "whatsapp",
            "NOT_CONFIGURED — set WHATSAPP_API_URL and WHATSAPP_API_TOKEN (INTEGRATIONS_MODE=live for real send)",
        )
    phone = askeva.normalize_phone(to_phone)
    if not phone:
        return {
            "channel": "whatsapp",
            "status": FAILED,
            "delivered": False,
            "providerConfigured": True,
            "liveVerified": False,
            "message": "Missing recipient phone",
            "event": event,
        }

    if settings.demo_integrations:
        demo.append_demo_outbox(
            {
                "channel": "whatsapp",
                "to": phone,
                "from": settings.whatsapp_from or demo.DEMO_WHATSAPP_FROM,
                "text": text,
                "event": event,
            }
        )
        return {
            "channel": "whatsapp",
            "status": MOCK_QUEUED,
            "legacyStatus": DEMO_SENT,
            "delivered": False,
            "providerConfigured": True,
            "demo": True,
            "liveVerified": False,
            "message": "MOCK_QUEUED — written to local outbox (not a real WhatsApp send)",
            "event": event,
        }

    resolved_template = (template_name or template_for_event(event) or "").strip() or None

    try:
        if askeva.is_askeva_url(settings.whatsapp_api_url):
            # 1) Correct content as free text unless caller forced a template.
            if not force_template:
                response = _askeva_post(
                    phone=phone,
                    text=text,
                    template_name=None,
                    template_params=None,
                )
                if response.status_code < 400:
                    return {
                        "channel": "whatsapp",
                        "status": SENT,
                        "delivered": True,
                        "providerConfigured": True,
                        "liveVerified": True,
                        "message": "Provider accepted message",
                        "provider": "askeva",
                        "mode": "text",
                        "event": event,
                    }
                detail = ""
                try:
                    detail = str(response.text or "")[:240]
                except Exception:  # noqa: BLE001
                    detail = f"Provider HTTP {response.status_code}"
                # 2) Session closed → event template (must match that event's content vars).
                if "session is not opened" in detail.lower() and resolved_template:
                    response = _askeva_post(
                        phone=phone,
                        text=text,
                        template_name=resolved_template,
                        template_params=template_params,
                    )
                    if response.status_code < 400:
                        return {
                            "channel": "whatsapp",
                            "status": SENT,
                            "delivered": True,
                            "providerConfigured": True,
                            "liveVerified": True,
                            "message": f"Provider accepted template '{resolved_template}'",
                            "provider": "askeva",
                            "mode": "template",
                            "template": resolved_template,
                            "event": event,
                        }
                    try:
                        detail = str(response.text or "")[:240]
                    except Exception:  # noqa: BLE001
                        detail = f"Provider HTTP {response.status_code}"
                    return _whatsapp_failure(detail, event=event)
                return _whatsapp_failure(detail, event=event)

            response = _askeva_post(
                phone=phone,
                text=text,
                template_name=resolved_template,
                template_params=template_params,
            )
            if response.status_code >= 400:
                try:
                    detail = str(response.text or "")[:240]
                except Exception:  # noqa: BLE001
                    detail = f"Provider HTTP {response.status_code}"
                return _whatsapp_failure(detail, event=event)
            return {
                "channel": "whatsapp",
                "status": SENT,
                "delivered": True,
                "providerConfigured": True,
                "liveVerified": True,
                "message": f"Provider accepted template '{resolved_template}'",
                "provider": "askeva",
                "mode": "template",
                "template": resolved_template,
                "event": event,
            }

        payload = {
            "to": phone,
            "from": settings.whatsapp_from or None,
            "text": text,
        }
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
            try:
                detail = str(response.text or "")[:240]
            except Exception:  # noqa: BLE001
                detail = f"Provider HTTP {response.status_code}"
            return _whatsapp_failure(detail, event=event)
        return {
            "channel": "whatsapp",
            "status": SENT,
            "delivered": True,
            "providerConfigured": True,
            "liveVerified": True,
            "message": "Provider accepted message",
            "provider": "http",
            "mode": "text",
            "event": event,
        }
    except Exception as exc:  # noqa: BLE001
        log.warning("whatsapp_send_failed")
        return {
            "channel": "whatsapp",
            "status": FAILED,
            "delivered": False,
            "providerConfigured": True,
            "liveVerified": False,
            "message": f"WhatsApp error: {type(exc).__name__}",
            "event": event,
        }


def notify_event(
    *,
    event_key: str,
    subject: str,
    body: str,
    email: str | None = None,
    phone: str | None = None,
    event: str | None = None,
    template_params: list[str] | None = None,
) -> dict:
    """Notify after a saved business event. Never raises. Does not retry a send that already queued."""
    key = str(event_key or "").strip()
    if not key:
        return {"eventKey": "", "status": "skipped", "email": None, "whatsapp": None}
    if key in _delivered_event_keys:
        return {"eventKey": key, "status": "skipped_duplicate", "email": None, "whatsapp": None}
    email_result = None
    whatsapp_result = None
    if email:
        email_result = send_email(to=email, subject=subject, body=body)
    if phone:
        whatsapp_result = send_whatsapp(
            to_phone=phone,
            text=f"{subject}\n\n{body}" if subject else body,
            event=event,
            template_params=template_params,
        )
    queued = {MOCK_QUEUED, SENT}
    email_ok = email_result and email_result.get("status") in queued
    whatsapp_ok = whatsapp_result and whatsapp_result.get("status") in queued
    if email_ok or whatsapp_ok:
        _delivered_event_keys.add(key)
    return {
        "eventKey": key,
        "status": "recorded",
        "email": email_result,
        "whatsapp": whatsapp_result,
    }
