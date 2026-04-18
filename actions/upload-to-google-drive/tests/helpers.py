"""
Shared test constants and mock factories.

Importing this module also ensures that src/ is on sys.path, so every test
file that does `from helpers import ...` can import production modules directly.
"""

import os
import sys
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

FAKE_FILE_ID = "fake-file-id-123"
FAKE_FOLDER_ID = "fake-folder-id-456"
FAKE_NEW_FOLDER_ID = "new-folder-id-789"
FAKE_WEB_VIEW_LINK = "https://drive.google.com/file/d/fake-file-id-123/view"
FAKE_FILE_NAME = "com.sitoo.pos-12345-v1.5.1-public-release.apk"

UPLOAD_RESPONSE = {
    "id": FAKE_FILE_ID,
    "name": FAKE_FILE_NAME,
    "webViewLink": FAKE_WEB_VIEW_LINK,
}

# ---------------------------------------------------------------------------
# Mock factories
# ---------------------------------------------------------------------------


def make_drive_service(
    list_responses: list[dict] = None,
    upload_response: dict = None,
) -> tuple[MagicMock, MagicMock]:
    """
    Return (service_mock, upload_request_mock).

    list_responses is consumed in order by successive calls to
    service.files().list(...).execute(). Defaults to [{"files": []}].

    upload_response is returned by upload_request_mock.next_chunk() as
    (None, upload_response), ending the resumable-upload loop.
    """
    if list_responses is None:
        list_responses = [{"files": []}]
    if upload_response is None:
        upload_response = UPLOAD_RESPONSE

    service = MagicMock()

    service.files.return_value.list.return_value.execute.side_effect = list_responses

    folder_create_mock = MagicMock()
    folder_create_mock.execute.return_value = {"id": FAKE_NEW_FOLDER_ID}

    upload_request_mock = MagicMock()
    upload_request_mock.next_chunk.return_value = (None, upload_response)

    create_calls = iter([folder_create_mock, upload_request_mock])

    def _create_side_effect(**kwargs):
        body = kwargs.get("body", {})
        if body.get("mimeType") == "application/vnd.google-apps.folder":
            return folder_create_mock
        return upload_request_mock

    service.files.return_value.create.side_effect = _create_side_effect

    return service, upload_request_mock
