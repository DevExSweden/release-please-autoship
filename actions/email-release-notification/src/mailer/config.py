"""EmailConfig dataclass and input-cleaning utilities."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path


def clean(value: str) -> str:
    """Strip whitespace and carriage returns (common in GitHub repo variables)."""
    return value.replace("\r", "").strip()


def parse_recipients(csv: str) -> list[str]:
    """Return a list of trimmed, non-empty email addresses from a CSV string."""
    return [clean(addr) for addr in csv.split(",") if clean(addr)]


@dataclass
class EmailConfig:
    template_path: Path
    app_name: str
    version: str
    recipients: list[str]
    sender_email: str
    sender_name: str
    google_drive_url: str
    api_key: str = field(repr=False)

    def validate(self) -> None:
        """Collect all validation errors and exit if any are found."""
        errors: list[str] = []

        if not self.template_path.is_file():
            errors.append(f"Template file not found: {self.template_path}")

        if not self.app_name:
            errors.append("--app-name is required.")

        if not self.version:
            errors.append("--version is required.")

        if not self.recipients:
            errors.append("--recipients is required (need at least one BCC address).")

        if not self.sender_email:
            errors.append(
                "--sender is empty. Set it to your SendGrid-verified From address."
            )
        elif "@" not in self.sender_email:
            errors.append(
                f"--sender must be a valid email (got: {self.sender_email!r})."
            )

        if not self.google_drive_url:
            errors.append("--drive-url is required.")

        if not self.api_key:
            errors.append("SENDGRID_API_KEY environment variable is not set.")

        if errors:
            for msg in errors:
                print(f"Error: {msg}", file=sys.stderr)
            sys.exit(1)
