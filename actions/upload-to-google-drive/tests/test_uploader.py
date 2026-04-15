"""Unit tests for drive.uploader."""

from __future__ import annotations

import tempfile
import unittest
from unittest.mock import MagicMock, patch

from helpers import (  # triggers sys.path setup
    FAKE_FILE_ID,
    FAKE_FILE_NAME,
    FAKE_FOLDER_ID,
    FAKE_NEW_FOLDER_ID,
    FAKE_WEB_VIEW_LINK,
    UPLOAD_RESPONSE,
    make_drive_service,
)


# ---------------------------------------------------------------------------
# find_or_create_folder
# ---------------------------------------------------------------------------


class TestFindOrCreateFolder(unittest.TestCase):
    def test_returns_existing_folder_id(self):
        from drive.uploader import find_or_create_folder

        service = MagicMock()
        service.files.return_value.list.return_value.execute.return_value = {
            "files": [{"id": "existing-folder-id", "name": "1.5.1"}]
        }

        result = find_or_create_folder(service, "1.5.1", FAKE_FOLDER_ID)

        assert result == "existing-folder-id"

    def test_creates_folder_when_not_found(self):
        from drive.uploader import find_or_create_folder

        service = MagicMock()
        service.files.return_value.list.return_value.execute.return_value = {"files": []}
        service.files.return_value.create.return_value.execute.return_value = {"id": FAKE_NEW_FOLDER_ID}

        result = find_or_create_folder(service, "1.5.1", FAKE_FOLDER_ID)

        assert result == FAKE_NEW_FOLDER_ID

    def test_does_not_create_folder_when_already_exists(self):
        from drive.uploader import find_or_create_folder

        service = MagicMock()
        service.files.return_value.list.return_value.execute.return_value = {
            "files": [{"id": "existing-id", "name": "1.5.1"}]
        }

        find_or_create_folder(service, "1.5.1", FAKE_FOLDER_ID)

        service.files.return_value.create.assert_not_called()

    def test_create_called_with_correct_metadata(self):
        from drive.uploader import find_or_create_folder

        service = MagicMock()
        service.files.return_value.list.return_value.execute.return_value = {"files": []}
        service.files.return_value.create.return_value.execute.return_value = {"id": FAKE_NEW_FOLDER_ID}

        find_or_create_folder(service, "1.5.1", FAKE_FOLDER_ID)

        _, kwargs = service.files.return_value.create.call_args
        assert kwargs["body"]["name"] == "1.5.1"
        assert kwargs["body"]["mimeType"] == "application/vnd.google-apps.folder"
        assert kwargs["body"]["parents"] == [FAKE_FOLDER_ID]

    def test_list_query_excludes_trashed(self):
        from drive.uploader import find_or_create_folder

        service = MagicMock()
        service.files.return_value.list.return_value.execute.return_value = {"files": []}
        service.files.return_value.create.return_value.execute.return_value = {"id": FAKE_NEW_FOLDER_ID}

        find_or_create_folder(service, "1.5.1", FAKE_FOLDER_ID)

        _, kwargs = service.files.return_value.list.call_args
        assert "trashed = false" in kwargs["q"]


# ---------------------------------------------------------------------------
# find_existing_file
# ---------------------------------------------------------------------------


class TestFindExistingFile(unittest.TestCase):
    def test_returns_file_when_exists(self):
        from drive.uploader import find_existing_file

        existing = {"id": FAKE_FILE_ID, "name": FAKE_FILE_NAME, "webViewLink": FAKE_WEB_VIEW_LINK}
        service = MagicMock()
        service.files.return_value.list.return_value.execute.return_value = {"files": [existing]}

        result = find_existing_file(service, FAKE_FILE_NAME, FAKE_FOLDER_ID)

        assert result == existing

    def test_returns_none_when_not_found(self):
        from drive.uploader import find_existing_file

        service = MagicMock()
        service.files.return_value.list.return_value.execute.return_value = {"files": []}

        result = find_existing_file(service, FAKE_FILE_NAME, FAKE_FOLDER_ID)

        assert result is None

    def test_list_query_excludes_folders(self):
        from drive.uploader import find_existing_file

        service = MagicMock()
        service.files.return_value.list.return_value.execute.return_value = {"files": []}

        find_existing_file(service, FAKE_FILE_NAME, FAKE_FOLDER_ID)

        _, kwargs = service.files.return_value.list.call_args
        assert "mimeType !=" in kwargs["q"]
        assert "application/vnd.google-apps.folder" in kwargs["q"]

    def test_list_query_excludes_trashed(self):
        from drive.uploader import find_existing_file

        service = MagicMock()
        service.files.return_value.list.return_value.execute.return_value = {"files": []}

        find_existing_file(service, FAKE_FILE_NAME, FAKE_FOLDER_ID)

        _, kwargs = service.files.return_value.list.call_args
        assert "trashed = false" in kwargs["q"]


# ---------------------------------------------------------------------------
# upload_file
# ---------------------------------------------------------------------------


class TestUploadFile(unittest.TestCase):

    @patch("drive.uploader.build")
    @patch("drive.uploader.MediaFileUpload")
    def test_skips_upload_when_file_exists(self, mock_media, mock_build):
        from drive.uploader import upload_file

        existing = {"id": FAKE_FILE_ID, "name": FAKE_FILE_NAME, "webViewLink": FAKE_WEB_VIEW_LINK}
        service, _ = make_drive_service(list_responses=[{"files": [existing]}])
        mock_build.return_value = service

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            result = upload_file(MagicMock(), tmp.name, FAKE_FOLDER_ID, FAKE_FILE_NAME)

        assert result == existing
        mock_media.assert_not_called()

    @patch("drive.uploader.build")
    @patch("drive.uploader.MediaFileUpload")
    def test_skips_create_when_file_exists(self, mock_media, mock_build):
        from drive.uploader import upload_file

        existing = {"id": FAKE_FILE_ID, "name": FAKE_FILE_NAME, "webViewLink": FAKE_WEB_VIEW_LINK}
        service, _ = make_drive_service(list_responses=[{"files": [existing]}])
        mock_build.return_value = service

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            upload_file(MagicMock(), tmp.name, FAKE_FOLDER_ID, FAKE_FILE_NAME)

        service.files.return_value.create.assert_not_called()

    @patch("drive.uploader.build")
    @patch("drive.uploader.MediaFileUpload")
    def test_uploads_when_file_not_found(self, mock_media, mock_build):
        from drive.uploader import upload_file

        service, upload_request = make_drive_service(list_responses=[{"files": []}])
        mock_build.return_value = service

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            result = upload_file(MagicMock(), tmp.name, FAKE_FOLDER_ID, FAKE_FILE_NAME)

        assert result == UPLOAD_RESPONSE
        upload_request.next_chunk.assert_called()

    @patch("drive.uploader.build")
    @patch("drive.uploader.MediaFileUpload")
    def test_upload_create_called_with_correct_metadata(self, mock_media, mock_build):
        from drive.uploader import upload_file

        service, _ = make_drive_service(list_responses=[{"files": []}])
        mock_build.return_value = service

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            upload_file(MagicMock(), tmp.name, FAKE_FOLDER_ID, FAKE_FILE_NAME)

        _, kwargs = service.files.return_value.create.call_args
        assert kwargs["body"]["name"] == FAKE_FILE_NAME
        assert kwargs["body"]["parents"] == [FAKE_FOLDER_ID]
        assert kwargs["supportsAllDrives"] is True

    @patch("drive.uploader.build")
    @patch("drive.uploader.MediaFileUpload")
    def test_uses_subfolder_as_upload_target(self, mock_media, mock_build):
        from drive.uploader import upload_file

        # list call 1: folder search → existing folder
        # list call 2: file search → not found
        service, _ = make_drive_service(
            list_responses=[
                {"files": [{"id": "version-folder-id", "name": "1.5.1"}]},
                {"files": []},
            ]
        )
        mock_build.return_value = service

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            upload_file(MagicMock(), tmp.name, FAKE_FOLDER_ID, FAKE_FILE_NAME, subfolder="1.5.1")

        _, kwargs = service.files.return_value.create.call_args
        assert kwargs["body"]["parents"] == ["version-folder-id"]

    @patch("drive.uploader.build")
    @patch("drive.uploader.MediaFileUpload")
    def test_creates_subfolder_when_not_found(self, mock_media, mock_build):
        from drive.uploader import upload_file

        # list call 1: folder search → not found → folder gets created
        # list call 2: file search → not found → file gets uploaded
        service, _ = make_drive_service(
            list_responses=[
                {"files": []},
                {"files": []},
            ]
        )
        mock_build.return_value = service

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            upload_file(MagicMock(), tmp.name, FAKE_FOLDER_ID, FAKE_FILE_NAME, subfolder="1.5.1")

        create_calls = service.files.return_value.create.call_args_list
        folder_call = next(
            (c for c in create_calls if c[1].get("body", {}).get("mimeType") == "application/vnd.google-apps.folder"),
            None,
        )
        assert folder_call is not None, "Expected a folder creation call"
        assert folder_call[1]["body"]["name"] == "1.5.1"

    @patch("drive.uploader.build")
    @patch("drive.uploader.MediaFileUpload")
    def test_upload_with_progress(self, mock_media, mock_build):
        from drive.uploader import upload_file

        service, upload_request = make_drive_service(list_responses=[{"files": []}])
        mock_build.return_value = service

        progress_status = MagicMock()
        progress_status.progress.return_value = 0.5
        upload_request.next_chunk.side_effect = [
            (progress_status, None),
            (None, UPLOAD_RESPONSE),
        ]

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            result = upload_file(MagicMock(), tmp.name, FAKE_FOLDER_ID, FAKE_FILE_NAME)

        assert result == UPLOAD_RESPONSE
        assert upload_request.next_chunk.call_count == 2


if __name__ == "__main__":
    unittest.main()
