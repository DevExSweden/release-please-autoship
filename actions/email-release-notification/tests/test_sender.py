"""Tests for mailer.sender — build_payload, send, _handle_http_error."""

from __future__ import annotations

import io
import json
import urllib.error
import urllib.request
from http.client import HTTPMessage
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from helpers import FAKE_SENDER, FAKE_RECIPIENT, FAKE_DRIVE_URL, FAKE_API_KEY  # sets up sys.path
from mailer.config import EmailConfig
from mailer.sender import SENDGRID_MAIL_URL, build_payload, send, _handle_http_error


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def config():
    return EmailConfig(
        template_path=Path("/fake/email.html"),
        app_name="Sitoo POS",
        version="1.7.0",
        recipients=[FAKE_RECIPIENT, "b@example.com"],
        sender_email=FAKE_SENDER,
        sender_name="Mobile App Team",
        google_drive_url=FAKE_DRIVE_URL,
        api_key=FAKE_API_KEY,
    )


# ---------------------------------------------------------------------------
# build_payload()
# ---------------------------------------------------------------------------

class TestBuildPayload:
    def test_subject_contains_app_name_and_version(self, config):
        payload = build_payload(config, "<p>body</p>")
        assert payload["subject"] == "Sitoo POS 1.7.0 is now available"

    def test_from_field_uses_sender_email_and_name(self, config):
        payload = build_payload(config, "")
        assert payload["from"] == {"email": FAKE_SENDER, "name": "Mobile App Team"}

    def test_to_envelope_is_sender(self, config):
        payload = build_payload(config, "")
        to_list = payload["personalizations"][0]["to"]
        assert to_list == [{"email": FAKE_SENDER}]

    def test_all_recipients_in_bcc(self, config):
        payload = build_payload(config, "")
        bcc = payload["personalizations"][0]["bcc"]
        assert {"email": FAKE_RECIPIENT} in bcc
        assert {"email": "b@example.com"} in bcc

    def test_recipients_not_in_to(self, config):
        payload = build_payload(config, "")
        to_emails = [entry["email"] for entry in payload["personalizations"][0]["to"]]
        assert FAKE_RECIPIENT not in to_emails
        assert "b@example.com" not in to_emails

    def test_html_content_is_set(self, config):
        payload = build_payload(config, "<p>hello</p>")
        content = payload["content"]
        assert content == [{"type": "text/html", "value": "<p>hello</p>"}]

    def test_single_recipient_produces_one_bcc_entry(self, config):
        config.recipients = ["only@example.com"]
        payload = build_payload(config, "")
        assert payload["personalizations"][0]["bcc"] == [{"email": "only@example.com"}]

    def test_payload_is_json_serialisable(self, config):
        payload = build_payload(config, "<html/>")
        dumped = json.dumps(payload)
        assert json.loads(dumped) == payload


# ---------------------------------------------------------------------------
# send() — HTTP interaction via unittest.mock
# ---------------------------------------------------------------------------

def _make_http_error(code: int, body: str) -> urllib.error.HTTPError:
    """Build a synthetic HTTPError with a readable body."""
    return urllib.error.HTTPError(
        url=SENDGRID_MAIL_URL,
        code=code,
        msg="",
        hdrs=HTTPMessage(),
        fp=io.BytesIO(body.encode()),
    )


class TestSend:
    def test_successful_send_prints_status(self, config, capsys):
        mock_resp = MagicMock()
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_resp.status = 202

        with patch("urllib.request.urlopen", return_value=mock_resp):
            send(config, build_payload(config, "<p/>"))

        out = capsys.readouterr().out
        assert "202" in out
        assert "successfully" in out

    def test_send_posts_to_correct_url(self, config):
        mock_resp = MagicMock()
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_resp.status = 202

        with patch("urllib.request.urlopen", return_value=mock_resp) as mock_open:
            send(config, build_payload(config, ""))

        request: urllib.request.Request = mock_open.call_args[0][0]
        assert request.full_url == SENDGRID_MAIL_URL

    def test_send_uses_bearer_auth_header(self, config):
        mock_resp = MagicMock()
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_resp.status = 202

        with patch("urllib.request.urlopen", return_value=mock_resp) as mock_open:
            send(config, build_payload(config, ""))

        request: urllib.request.Request = mock_open.call_args[0][0]
        assert request.get_header("Authorization") == f"Bearer {FAKE_API_KEY}"

    def test_http_400_exits_with_nonzero(self, config):
        with patch(
            "urllib.request.urlopen",
            side_effect=_make_http_error(400, '{"errors":[{"message":"bad"}]}'),
        ):
            with pytest.raises(SystemExit) as exc_info:
                send(config, build_payload(config, ""))
        assert exc_info.value.code != 0

    def test_http_500_exits_with_nonzero(self, config):
        with patch(
            "urllib.request.urlopen",
            side_effect=_make_http_error(500, "internal error"),
        ):
            with pytest.raises(SystemExit) as exc_info:
                send(config, build_payload(config, ""))
        assert exc_info.value.code != 0

    def test_url_error_exits_with_nonzero(self, config):
        with patch(
            "urllib.request.urlopen",
            side_effect=urllib.error.URLError("connection refused"),
        ):
            with pytest.raises(SystemExit) as exc_info:
                send(config, build_payload(config, ""))
        assert exc_info.value.code != 0

    def test_url_error_prints_reason(self, config, capsys):
        with patch(
            "urllib.request.urlopen",
            side_effect=urllib.error.URLError("connection refused"),
        ):
            with pytest.raises(SystemExit):
                send(config, build_payload(config, ""))
        assert "connection refused" in capsys.readouterr().err


# ---------------------------------------------------------------------------
# _handle_http_error() — SendGrid from-address hint
# ---------------------------------------------------------------------------

class TestHandleHttpError:
    def test_invalid_from_email_prints_hint(self, capsys):
        exc = _make_http_error(400, '{"errors":[{"message":"Invalid from email address","field":"from"}]}')
        with pytest.raises(SystemExit):
            _handle_http_error(exc)
        assert "Hint" in capsys.readouterr().err

    def test_field_from_error_prints_hint(self, capsys):
        exc = _make_http_error(400, '{"errors":[{"field":"from","message":"something"}]}')
        with pytest.raises(SystemExit):
            _handle_http_error(exc)
        assert "Hint" in capsys.readouterr().err

    def test_non_400_does_not_print_hint(self, capsys):
        exc = _make_http_error(500, "internal server error")
        with pytest.raises(SystemExit):
            _handle_http_error(exc)
        assert "Hint" not in capsys.readouterr().err

    def test_unrelated_400_does_not_print_hint(self, capsys):
        exc = _make_http_error(400, '{"errors":[{"message":"Bad request"}]}')
        with pytest.raises(SystemExit):
            _handle_http_error(exc)
        assert "Hint" not in capsys.readouterr().err

    def test_error_body_is_printed(self, capsys):
        exc = _make_http_error(400, "some error detail")
        with pytest.raises(SystemExit):
            _handle_http_error(exc)
        assert "some error detail" in capsys.readouterr().err
