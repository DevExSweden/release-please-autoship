"""HTML template rendering."""

from __future__ import annotations

from pathlib import Path


def render(template_path: Path, mapping: dict[str, str]) -> str:
    """
    Read *template_path* and replace every ``{{KEY}}`` token with the
    corresponding value from *mapping*.
    """
    html = template_path.read_text(encoding="utf-8")
    for key, value in mapping.items():
        html = html.replace(f"{{{{{key}}}}}", value)
    return html
