"""
Shared test constants and utilities.

Importing this module also adds src/ to sys.path so every test file that does
`from helpers import ...` can import production modules directly — matching the
pattern used by the upload-to-google-drive action.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

FAKE_SENDER = "sender@example.com"
FAKE_RECIPIENT = "recipient@example.com"
FAKE_DRIVE_URL = "https://drive.google.com/drive/folders/fake123"
FAKE_API_KEY = "SG.fake_key"
