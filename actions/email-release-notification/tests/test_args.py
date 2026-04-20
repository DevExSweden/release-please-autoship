"""Tests for mailer.args — config_from_args()."""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import patch

import pytest

from helpers import FAKE_SENDER, FAKE_DRIVE_URL, FAKE_API_KEY  # sets up sys.path
from mailer.args import config_from_args


def _argv(template: str, **overrides) -> list[str]:
    """Build a sys.argv list from keyword arguments with sensible defaults."""
    defaults = {
        "app_name": "Sitoo POS",
        "version": "1.7.0",
        "recipients": "a@example.com,b@example.com",
        "sender": FAKE_SENDER,
        "sender_name": "Mobile App Team",
        "drive_url": FAKE_DRIVE_URL,
    }
    defaults.update(overrides)
    return [
        "send_email.py",
        "--template", template,
        "--app-name", defaults["app_name"],
        "--version", defaults["version"],
        "--recipients", defaults["recipients"],
        "--sender", defaults["sender"],
        "--sender-name", defaults["sender_name"],
        "--drive-url", defaults["drive_url"],
    ]


class TestConfigFromArgs:
    def test_builds_config_from_argv_and_env(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html/>")
        argv = _argv(str(template))

        with patch.object(sys, "argv", argv), \
             patch.dict("os.environ", {"SENDGRID_API_KEY": FAKE_API_KEY}, clear=False):
            config = config_from_args()

        assert config.template_path == Path(str(template))
        assert config.app_name == "Sitoo POS"
        assert config.version == "1.7.0"
        assert config.recipients == ["a@example.com", "b@example.com"]
        assert config.sender_email == FAKE_SENDER
        assert config.sender_name == "Mobile App Team"
        assert config.google_drive_url == FAKE_DRIVE_URL
        assert config.api_key == FAKE_API_KEY

    def test_api_key_read_from_environment(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html/>")

        with patch.object(sys, "argv", _argv(str(template))), \
             patch.dict("os.environ", {"SENDGRID_API_KEY": FAKE_API_KEY}, clear=False):
            config = config_from_args()

        assert config.api_key == FAKE_API_KEY

    def test_missing_api_key_returns_empty_string(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html/>")

        env_without_key = {k: v for k, v in __import__("os").environ.items()
                           if k != "SENDGRID_API_KEY"}
        with patch.object(sys, "argv", _argv(str(template))), \
             patch.dict("os.environ", env_without_key, clear=True):
            config = config_from_args()

        assert config.api_key == ""

    def test_whitespace_in_args_is_trimmed(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html/>")
        argv = _argv(str(template), app_name="  Sitoo POS  ", version=" 1.7.0\r")

        with patch.object(sys, "argv", argv), \
             patch.dict("os.environ", {"SENDGRID_API_KEY": "k"}, clear=False):
            config = config_from_args()

        assert config.app_name == "Sitoo POS"
        assert config.version == "1.7.0"

    def test_empty_sender_name_defaults_to_mobile_app_team(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html/>")
        argv = _argv(str(template), sender_name="   ")

        with patch.object(sys, "argv", argv), \
             patch.dict("os.environ", {"SENDGRID_API_KEY": "k"}, clear=False):
            config = config_from_args()

        assert config.sender_name == "Mobile App Team"

    def test_recipients_are_split_and_trimmed(self, tmp_path):
        template = tmp_path / "email.html"
        template.write_text("<html/>")
        argv = _argv(str(template), recipients=" a@x.com , b@y.com , c@z.com ")

        with patch.object(sys, "argv", argv), \
             patch.dict("os.environ", {"SENDGRID_API_KEY": "k"}, clear=False):
            config = config_from_args()

        assert config.recipients == ["a@x.com", "b@y.com", "c@z.com"]

    def test_missing_required_arg_exits(self, tmp_path):
        with patch.object(sys, "argv", ["send_email.py"]):
            with pytest.raises(SystemExit):
                config_from_args()
