"""AskEva WhatsApp client + notify wiring (mocked HTTP)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.services.integrations import askeva
from app.services.integrations import notify as notify_mod
from app.services.integrations.statuses import FAILED, SENT


def test_normalize_phone_india():
    assert askeva.normalize_phone("9876543210") == "919876543210"
    assert askeva.normalize_phone("+91 98765-43210") == "919876543210"
    assert askeva.normalize_phone("0919876543210") == "919876543210"


def test_text_and_template_payload():
    text = askeva.text_payload(to_phone="9876543210", body="Hi")
    assert text == {"to": "919876543210", "type": "text", "text": {"body": "Hi"}}
    tpl = askeva.template_payload(
        to_phone="9876543210",
        template_name="fee_receipt",
        body_params=["A", "B"],
    )
    assert tpl["type"] == "template"
    assert tpl["template"]["name"] == "fee_receipt"
    assert len(tpl["template"]["components"][0]["parameters"]) == 2


def test_send_whatsapp_uses_askeva_query_token(monkeypatch):
    monkeypatch.setenv("INTEGRATIONS_MODE", "live")
    notify_mod.settings.integrations_mode = "live"
    notify_mod.settings.whatsapp_api_url = "https://backend.askeva.io/v1/message/send-message"
    notify_mod.settings.whatsapp_api_token = "test-token"
    notify_mod.settings.whatsapp_from = "918012558133"
    notify_mod.settings.whatsapp_template_name = ""

    fake = MagicMock()
    fake.status_code = 200
    fake.text = '{"ok":true}'

    with patch("app.services.integrations.askeva.httpx.post", return_value=fake) as post:
        result = notify_mod.send_whatsapp(to_phone="9876543210", text="Fee receipt test")
        assert result["status"] == SENT
        assert result["delivered"] is True
        assert result.get("provider") == "askeva"
        args, kwargs = post.call_args
        assert "token=test-token" in args[0]
        assert kwargs["json"]["to"] == "919876543210"
        assert kwargs["json"]["type"] == "text"


def test_send_whatsapp_provider_error(monkeypatch):
    monkeypatch.setenv("INTEGRATIONS_MODE", "live")
    notify_mod.settings.integrations_mode = "live"
    notify_mod.settings.whatsapp_api_url = "https://backend.askeva.io/v1/message/send-message"
    notify_mod.settings.whatsapp_api_token = "test-token"
    notify_mod.settings.whatsapp_template_name = ""

    fake = MagicMock()
    fake.status_code = 401
    fake.text = "unauthorized"

    with patch("app.services.integrations.askeva.httpx.post", return_value=fake):
        result = notify_mod.send_whatsapp(to_phone="9876543210", text="x")
        assert result["status"] == FAILED
        assert result["delivered"] is False


def test_fee_receipt_tries_text_then_event_template(monkeypatch):
    monkeypatch.setenv("INTEGRATIONS_MODE", "live")
    notify_mod.settings.integrations_mode = "live"
    notify_mod.settings.whatsapp_api_url = "https://backend.askeva.io/v1/message/send-message"
    notify_mod.settings.whatsapp_api_token = "test-token"
    notify_mod.settings.whatsapp_template_name = "welcomemessage"
    notify_mod.settings.whatsapp_template_fee_receipt = "fee_payment_done"

    closed = MagicMock()
    closed.status_code = 400
    closed.text = '{"error":"Session is not opened!"}'
    accepted = MagicMock()
    accepted.status_code = 200
    accepted.text = '{"messages":[{"message_status":"accepted"}]}'

    with patch("app.services.integrations.askeva.httpx.post", side_effect=[closed, accepted]) as post:
        result = notify_mod.send_whatsapp(
            to_phone="9876543210",
            text="QMIS: Fee receipt R-1 for A. Amount ₹100.",
            event="fee_receipt",
            template_params=["A", "₹100", "A", "R-1"],
        )
        assert result["status"] == SENT
        assert result.get("mode") == "template"
        assert result.get("template") == "fee_payment_done"
        assert post.call_count == 2
        first = post.call_args_list[0].kwargs["json"]
        second = post.call_args_list[1].kwargs["json"]
        assert first["type"] == "text"
        assert "Fee receipt" in first["text"]["body"]
        assert second["type"] == "template"
        assert second["template"]["name"] == "fee_payment_done"
        assert len(second["template"]["components"][0]["parameters"]) == 4


def test_fee_receipt_never_falls_back_to_welcome_template(monkeypatch):
    monkeypatch.setenv("INTEGRATIONS_MODE", "live")
    notify_mod.settings.integrations_mode = "live"
    notify_mod.settings.whatsapp_api_url = "https://backend.askeva.io/v1/message/send-message"
    notify_mod.settings.whatsapp_api_token = "test-token"
    notify_mod.settings.whatsapp_template_name = "welcomemessage"
    notify_mod.settings.whatsapp_template_fee_receipt = ""

    closed = MagicMock()
    closed.status_code = 400
    closed.text = '{"error":"Session is not opened!"}'

    with patch("app.services.integrations.askeva.httpx.post", return_value=closed) as post:
        result = notify_mod.send_whatsapp(
            to_phone="9876543210",
            text="QMIS: Fee receipt R-1 for A. Amount ₹100.",
            event="fee_receipt",
        )
        assert result["status"] == FAILED
        assert post.call_count == 1
        assert post.call_args.kwargs["json"]["type"] == "text"
