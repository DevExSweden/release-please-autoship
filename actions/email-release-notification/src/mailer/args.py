"""CLI argument parsing for send_email.py."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from mailer.config import clean, parse_recipients, EmailConfig


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Send a branded HTML email via SendGrid with BCC recipients.",
    )
    parser.add_argument(
        "--template", required=True,
        help="Path to the HTML template file.",
    )
    parser.add_argument(
        "--app-name", required=True,
        help="Application name (used in subject and body).",
    )
    parser.add_argument(
        "--version", required=True,
        help="Release version string (e.g. 1.7.0).",
    )
    parser.add_argument(
        "--recipients", required=True,
        help="Comma-separated email addresses for BCC delivery.",
    )
    parser.add_argument(
        "--sender", required=True,
        help="SendGrid-verified From address.",
    )
    parser.add_argument(
        "--sender-name", default="Mobile App Team",
        help="From display name (default: 'Mobile App Team').",
    )
    parser.add_argument(
        "--drive-url", required=True,
        help="Google Drive folder URL included in the email body.",
    )
    return parser.parse_args()


def config_from_args() -> EmailConfig:
    """Parse CLI arguments and environment, return a populated EmailConfig."""
    args = parse_args()
    return EmailConfig(
        template_path=Path(clean(args.template)),
        app_name=clean(args.app_name),
        version=clean(args.version),
        recipients=parse_recipients(args.recipients),
        sender_email=clean(args.sender),
        sender_name=clean(args.sender_name) or "Mobile App Team",
        google_drive_url=clean(args.drive_url),
        api_key=os.environ.get("SENDGRID_API_KEY", "").strip(),
    )
