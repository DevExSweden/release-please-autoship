"""Tests for mailer.config — clean, parse_recipients, EmailConfig.validate."""

from __future__ import annotations

import pytest
from pathlib import Path

from helpers import FAKE_SENDER, FAKE_DRIVE_URL, FAKE_API_KEY  # sets up sys.path
from mailer.config import clean, parse_recipients, EmailConfig


# ---------------------------------------------------------------------------
# clean()
# ---------------------------------------------------------------------------

class TestClean:
    def test_strips_leading_and_trailing_whitespace(self):
        assert clean("  hello  ") == "hello"

    def test_strips_carriage_returns(self):
        assert clean("hello\r\n") == "hello"

    def test_strips_cr_in_middle_is_removed(self):
        assert clean("hel\rlo") == "hello"

    def test_empty_string_returns_empty(self):
        assert clean("") == ""

    def test_only_whitespace_returns_empty(self):
        assert clean("   \r\n  ") == ""

    def test_already_clean_string_unchanged(self):
        assert clean("user@example.com") == "user@example.com"


# ---------------------------------------------------------------------------
# parse_recipients()
# ---------------------------------------------------------------------------

class TestParseRecipients:
    def test_single_address(self):
        assert parse_recipients("a@b.com") == ["a@b.com"]

    def test_multiple_addresses(self):
        result = parse_recipients("a@b.com,c@d.com,e@f.com")
        assert result == ["a@b.com", "c@d.com", "e@f.com"]

    def test_trims_whitespace_around_addresses(self):
        result = parse_recipients("  a@b.com ,  c@d.com  ")
        assert result == ["a@b.com", "c@d.com"]

    def test_ignores_empty_slots(self):
        result = parse_recipients("a@b.com,,c@d.com,")
        assert result == ["a@b.com", "c@d.com"]

    def test_strips_carriage_returns(self):
        result = parse_recipients("a@b.com\r,c@d.com\r")
        assert result == ["a@b.com", "c@d.com"]

    def test_empty_string_returns_empty_list(self):
        assert parse_recipients("") == []

    def test_only_commas_returns_empty_list(self):
        assert parse_recipients(",,,") == []


# ---------------------------------------------------------------------------
# EmailConfig.validate()
# ---------------------------------------------------------------------------

def _valid_config(template_path: Path) -> EmailConfig:
    return EmailConfig(
        template_path=template_path,
        app_name="Sitoo POS",
        version="1.7.0",
        recipients=["user@example.com"],
        sender_email=FAKE_SENDER,
        sender_name="Mobile App Team",
        google_drive_url=FAKE_DRIVE_URL,
        api_key=FAKE_API_KEY,
    )


class TestEmailConfigValidate:
    def test_valid_config_does_not_raise(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html></html>")
        _valid_config(template).validate()

    def test_missing_template_exits(self, tmp_path):
        config = _valid_config(tmp_path / "nonexistent.html")
        with pytest.raises(SystemExit):
            config.validate()

    def test_empty_app_name_exits(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html></html>")
        config = _valid_config(template)
        config.app_name = ""
        with pytest.raises(SystemExit):
            config.validate()

    def test_empty_version_exits(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html></html>")
        config = _valid_config(template)
        config.version = ""
        with pytest.raises(SystemExit):
            config.validate()

    def test_empty_recipients_exits(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html></html>")
        config = _valid_config(template)
        config.recipients = []
        with pytest.raises(SystemExit):
            config.validate()

    def test_empty_sender_email_exits(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html></html>")
        config = _valid_config(template)
        config.sender_email = ""
        with pytest.raises(SystemExit):
            config.validate()

    def test_sender_without_at_sign_exits(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html></html>")
        config = _valid_config(template)
        config.sender_email = "notanemail"
        with pytest.raises(SystemExit):
            config.validate()

    def test_empty_drive_url_exits(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html></html>")
        config = _valid_config(template)
        config.google_drive_url = ""
        with pytest.raises(SystemExit):
            config.validate()

    def test_empty_api_key_exits(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html></html>")
        config = _valid_config(template)
        config.api_key = ""
        with pytest.raises(SystemExit):
            config.validate()

    def test_multiple_errors_reported_before_exit(self, tmp_path, capsys):
        config = _valid_config(tmp_path / "nonexistent.html")
        config.app_name = ""
        config.version = ""
        with pytest.raises(SystemExit):
            config.validate()
        stderr = capsys.readouterr().err
        assert "--app-name" in stderr
        assert "--version" in stderr
        assert "Template file not found" in stderr

    def test_api_key_not_in_repr(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html></html>")
        config = _valid_config(template)
        assert FAKE_API_KEY not in repr(config)
