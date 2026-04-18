#!/usr/bin/env python3
"""
Entrypoint for the email-release-notification action.

Delegates all work to the mailer package:
  mailer.args     – CLI argument parsing and EmailConfig construction
  mailer.template – HTML template rendering
  mailer.sender   – SendGrid payload building and HTTP delivery

Usage:
  SENDGRID_API_KEY=... send_email.py \\
    --template    <path>           \\
    --app-name    <name>           \\
    --version     <semver>         \\
    --recipients  <csv emails>     \\
    --sender      <email>          \\
    --sender-name <display name>   \\
    --drive-url   <url>

Recipients are placed on BCC only; the verified sender is the sole To envelope.
"""

from __future__ import annotations

from mailer.args import config_from_args
from mailer.sender import build_payload, send
from mailer.template import render


def main() -> None:
    config = config_from_args()
    config.validate()

    print("Rendering email template...")
    html_body = render(
        config.template_path,
        {
            "APP_NAME": config.app_name,
            "VERSION": config.version,
            "SENDER_NAME": config.sender_name,
            "GOOGLE_DRIVE_URL": config.google_drive_url,
        },
    )

    payload = build_payload(config, html_body)
    send(config, payload)


if __name__ == "__main__":
    main()
