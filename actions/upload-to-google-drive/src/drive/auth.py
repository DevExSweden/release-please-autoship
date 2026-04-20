"""Google Drive authentication via Application Default Credentials.

Credentials are provided at runtime by the google-github-actions/auth step,
which exchanges the GitHub OIDC token for a short-lived GCP access token via
Workload Identity Federation and writes a credential config file pointed to by
the GOOGLE_APPLICATION_CREDENTIALS environment variable.
"""

from __future__ import annotations

import google.auth

SCOPES = ["https://www.googleapis.com/auth/drive"]


def load_credentials() -> google.auth.credentials.Credentials:
    """Load credentials from Application Default Credentials."""
    credentials, _ = google.auth.default(scopes=SCOPES)
    return credentials
