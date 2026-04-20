"""SendGrid API v3 payload builder and HTTP sender."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

from mailer.config import EmailConfig

SENDGRID_MAIL_URL = "https://api.sendgrid.com/v3/mail/send"
REQUEST_TIMEOUT_SECONDS = 120


def build_payload(config: EmailConfig, html_body: str) -> dict:
    """
    Build the SendGrid v3 mail/send payload.

    All real recipients are placed on BCC only; the verified sender address is
    used as the sole To envelope to satisfy SendGrid's requirement of at least
    one To address without exposing recipients to each other.
    """
    bcc = [{"email": addr} for addr in config.recipients]
    return {
        "personalizations": [
            {
                "to": [{"email": config.sender_email}],
                "bcc": bcc,
            }
        ],
        "from": {"email": config.sender_email, "name": config.sender_name},
        "subject": f"{config.app_name} {config.version} is now available",
        "content": [{"type": "text/html", "value": html_body}],
    }


def send(config: EmailConfig, payload: dict) -> None:
    """POST *payload* to SendGrid and exit with a non-zero code on failure."""
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(
        SENDGRID_MAIL_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )

    print(
        f"Sending email (BCC: {len(config.recipients)} recipient(s); "
        f"To envelope: {config.sender_email})"
    )

    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as resp:
            print(f"Email sent successfully (HTTP {resp.status}).")
    except urllib.error.HTTPError as exc:
        _handle_http_error(exc)
    except urllib.error.URLError as exc:
        print(f"Error: request failed: {exc}", file=sys.stderr)
        sys.exit(1)


def _handle_http_error(exc: urllib.error.HTTPError) -> None:
    err_body = exc.read().decode("utf-8", errors="replace")
    print(f"Error: SendGrid API returned HTTP {exc.code}", file=sys.stderr)
    print(f"Response body:\n{err_body}", file=sys.stderr)

    if exc.code == 400 and (
        "Invalid from email" in err_body
        or ('"field"' in err_body and "from" in err_body)
    ):
        print(
            "\nHint: SendGrid only accepts From addresses verified in your "
            "SendGrid account (Sender Authentication → Single Sender or Domain "
            "Authentication). Use exactly that verified address in --sender.",
            file=sys.stderr,
        )

    sys.exit(1)
