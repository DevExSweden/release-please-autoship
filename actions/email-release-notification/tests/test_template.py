"""Tests for mailer.template — render()."""

from __future__ import annotations

import pytest
from pathlib import Path

from helpers import FAKE_DRIVE_URL  # sets up sys.path
from mailer.template import render


class TestRender:
    def test_replaces_single_token(self, tmp_path):
        t = tmp_path / "t.html"
        t.write_text("<p>Hello {{NAME}}</p>")
        assert render(t, {"NAME": "World"}) == "<p>Hello World</p>"

    def test_replaces_multiple_tokens(self, tmp_path):
        t = tmp_path / "t.html"
        t.write_text("{{APP_NAME}} {{VERSION}} is out")
        result = render(t, {"APP_NAME": "Sitoo POS", "VERSION": "1.7.0"})
        assert result == "Sitoo POS 1.7.0 is out"

    def test_replaces_same_token_appearing_multiple_times(self, tmp_path):
        t = tmp_path / "t.html"
        t.write_text("{{X}} and {{X}}")
        assert render(t, {"X": "hi"}) == "hi and hi"

    def test_unknown_token_left_intact(self, tmp_path):
        t = tmp_path / "t.html"
        t.write_text("Hello {{UNKNOWN}}")
        assert render(t, {"OTHER": "value"}) == "Hello {{UNKNOWN}}"

    def test_empty_mapping_returns_template_unchanged(self, tmp_path):
        content = "<html>{{TOKEN}}</html>"
        t = tmp_path / "t.html"
        t.write_text(content)
        assert render(t, {}) == content

    def test_token_value_containing_html_characters(self, tmp_path):
        t = tmp_path / "t.html"
        t.write_text('<a href="{{URL}}">link</a>')
        url = "https://drive.google.com/folder/123?a=1&b=2"
        result = render(t, {"URL": url})
        assert url in result

    def test_reads_utf8_content_correctly(self, tmp_path):
        t = tmp_path / "t.html"
        t.write_text("Héllo {{NAME}}", encoding="utf-8")
        assert render(t, {"NAME": "Wörld"}) == "Héllo Wörld"

    def test_missing_template_raises_file_not_found(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            render(tmp_path / "nonexistent.html", {})
