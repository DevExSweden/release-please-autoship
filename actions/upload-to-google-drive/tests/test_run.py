"""Unit tests for upload_to_drive.run."""

from __future__ import annotations

import os
import tempfile
import unittest
from unittest.mock import patch

from helpers import (  # triggers sys.path setup
    FAKE_FILE_ID,
    FAKE_FILE_NAME,
    FAKE_FOLDER_ID,
    FAKE_WEB_VIEW_LINK,
    UPLOAD_RESPONSE,
)


class TestRun(unittest.TestCase):

    @patch("upload_to_drive.load_credentials")
    @patch("upload_to_drive.upload_file")
    def test_returns_upload_result(self, mock_upload, mock_creds):
        from upload_to_drive import run

        mock_upload.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            result = run(tmp.name, FAKE_FOLDER_ID)

        assert result == UPLOAD_RESPONSE

    @patch("upload_to_drive.load_credentials")
    @patch("upload_to_drive.upload_file")
    def test_uses_basename_as_file_name_when_not_given(self, mock_upload, mock_creds):
        from upload_to_drive import run

        mock_upload.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix="-release.apk") as tmp:
            run(tmp.name, FAKE_FOLDER_ID)

        # upload_file(credentials, file_path, folder_id, file_name, subfolder)
        args, _ = mock_upload.call_args
        assert args[3] == os.path.basename(tmp.name)

    @patch("upload_to_drive.load_credentials")
    @patch("upload_to_drive.upload_file")
    def test_uses_custom_file_name_when_given(self, mock_upload, mock_creds):
        from upload_to_drive import run

        mock_upload.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            run(tmp.name, FAKE_FOLDER_ID, file_name="custom-name.apk")

        args, _ = mock_upload.call_args
        assert args[3] == "custom-name.apk"

    @patch("upload_to_drive.load_credentials")
    @patch("upload_to_drive.upload_file")
    def test_passes_subfolder_to_upload(self, mock_upload, mock_creds):
        from upload_to_drive import run

        mock_upload.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            run(tmp.name, FAKE_FOLDER_ID, subfolder="1.5.1")

        args, _ = mock_upload.call_args
        assert args[4] == "1.5.1"

    @patch("upload_to_drive.load_credentials")
    @patch("upload_to_drive.upload_file")
    def test_writes_github_output_when_path_given(self, mock_upload, mock_creds):
        from upload_to_drive import run

        mock_upload.return_value = UPLOAD_RESPONSE

        with tempfile.TemporaryDirectory() as tmp_dir:
            apk = os.path.join(tmp_dir, FAKE_FILE_NAME)
            open(apk, "wb").close()

            gh_output = os.path.join(tmp_dir, "github_output.txt")
            run(apk, FAKE_FOLDER_ID, github_output_path=gh_output)

            with open(gh_output) as fh:
                content = fh.read()

        assert f"file-id={FAKE_FILE_ID}\n" in content
        assert f"web-view-link={FAKE_WEB_VIEW_LINK}\n" in content

    @patch("upload_to_drive.load_credentials")
    @patch("upload_to_drive.upload_file")
    def test_does_not_create_github_output_when_path_empty(self, mock_upload, mock_creds):
        from upload_to_drive import run

        mock_upload.return_value = UPLOAD_RESPONSE

        with tempfile.TemporaryDirectory() as tmp_dir:
            apk = os.path.join(tmp_dir, FAKE_FILE_NAME)
            open(apk, "wb").close()

            run(apk, FAKE_FOLDER_ID, github_output_path="")

            assert not any(f.endswith(".txt") for f in os.listdir(tmp_dir))

    @patch("upload_to_drive.load_credentials")
    @patch("upload_to_drive.upload_file")
    def test_github_output_missing_web_view_link_writes_empty_string(self, mock_upload, mock_creds):
        from upload_to_drive import run

        mock_upload.return_value = {"id": FAKE_FILE_ID, "name": FAKE_FILE_NAME}

        with tempfile.TemporaryDirectory() as tmp_dir:
            apk = os.path.join(tmp_dir, FAKE_FILE_NAME)
            open(apk, "wb").close()

            gh_output = os.path.join(tmp_dir, "github_output.txt")
            run(apk, FAKE_FOLDER_ID, github_output_path=gh_output)

            with open(gh_output) as fh:
                content = fh.read()

        assert "web-view-link=\n" in content

    @patch("upload_to_drive.load_credentials")
    @patch("upload_to_drive.upload_file")
    def test_passes_credentials_to_upload(self, mock_upload, mock_creds):
        from upload_to_drive import run

        fake_creds = object()
        mock_creds.return_value = fake_creds
        mock_upload.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            run(tmp.name, FAKE_FOLDER_ID)

        args, _ = mock_upload.call_args
        assert args[0] is fake_creds


if __name__ == "__main__":
    unittest.main()
