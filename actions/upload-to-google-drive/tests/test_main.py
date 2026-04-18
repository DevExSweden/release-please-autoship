"""Unit tests for upload_to_drive.main."""

from __future__ import annotations

import os
import tempfile
import unittest
from unittest.mock import patch

from helpers import UPLOAD_RESPONSE  # triggers sys.path setup


class TestMain(unittest.TestCase):
    def _make_env(self, tmp_apk: str, **overrides) -> dict:
        base = {
            "FILE_PATH": tmp_apk,
            "FOLDER_ID": "fake-folder-id",
            "FILE_NAME": "",
            "SUBFOLDER": "",
            "GITHUB_OUTPUT": "",
        }
        return {**base, **overrides}

    @patch("upload_to_drive.run")
    def test_passes_file_path_and_folder_id(self, mock_run):
        import upload_to_drive

        mock_run.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            with patch.dict(os.environ, self._make_env(tmp.name)):
                upload_to_drive.main()

        _, kwargs = mock_run.call_args
        assert kwargs["file_path"] == tmp.name
        assert kwargs["folder_id"] == "fake-folder-id"

    @patch("upload_to_drive.run")
    def test_passes_optional_file_name(self, mock_run):
        import upload_to_drive

        mock_run.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            with patch.dict(os.environ, self._make_env(tmp.name, FILE_NAME="custom.apk")):
                upload_to_drive.main()

        _, kwargs = mock_run.call_args
        assert kwargs["file_name"] == "custom.apk"

    @patch("upload_to_drive.run")
    def test_passes_optional_subfolder(self, mock_run):
        import upload_to_drive

        mock_run.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            with patch.dict(os.environ, self._make_env(tmp.name, SUBFOLDER="1.5.1")):
                upload_to_drive.main()

        _, kwargs = mock_run.call_args
        assert kwargs["subfolder"] == "1.5.1"

    @patch("upload_to_drive.run")
    def test_passes_github_output_path(self, mock_run):
        import upload_to_drive

        mock_run.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            with patch.dict(os.environ, self._make_env(tmp.name, GITHUB_OUTPUT="/tmp/gh_out.txt")):
                upload_to_drive.main()

        _, kwargs = mock_run.call_args
        assert kwargs["github_output_path"] == "/tmp/gh_out.txt"

    @patch("upload_to_drive.run")
    def test_strips_whitespace_from_env_vars(self, mock_run):
        import upload_to_drive

        mock_run.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            with patch.dict(os.environ, self._make_env(f"  {tmp.name}  ", FOLDER_ID="  folder-id  ")):
                upload_to_drive.main()

        _, kwargs = mock_run.call_args
        assert kwargs["file_path"] == tmp.name
        assert kwargs["folder_id"] == "folder-id"

    def test_exits_when_file_path_not_set(self):
        import upload_to_drive

        with patch.dict(os.environ, {"FILE_PATH": "", "FOLDER_ID": "folder-id"}):
            with self.assertRaises(SystemExit) as ctx:
                upload_to_drive.main()

        assert ctx.exception.code == 1

    def test_exits_when_file_path_does_not_exist(self):
        import upload_to_drive

        with patch.dict(os.environ, {"FILE_PATH": "/nonexistent/path/app.apk", "FOLDER_ID": "folder-id"}):
            with self.assertRaises(SystemExit) as ctx:
                upload_to_drive.main()

        assert ctx.exception.code == 1

    def test_exits_when_folder_id_not_set(self):
        import upload_to_drive

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            with patch.dict(os.environ, {"FILE_PATH": tmp.name, "FOLDER_ID": ""}):
                with self.assertRaises(SystemExit) as ctx:
                    upload_to_drive.main()

        assert ctx.exception.code == 1

    @patch("upload_to_drive.run")
    def test_exits_with_code_1_on_runtime_error(self, mock_run):
        import upload_to_drive

        mock_run.side_effect = RuntimeError("Drive API error")

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            with patch.dict(os.environ, self._make_env(tmp.name)):
                with self.assertRaises(SystemExit) as ctx:
                    upload_to_drive.main()

        assert ctx.exception.code == 1

    @patch("upload_to_drive.run")
    def test_exits_with_code_1_on_value_error(self, mock_run):
        import upload_to_drive

        mock_run.side_effect = ValueError("Bad input")

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            with patch.dict(os.environ, self._make_env(tmp.name)):
                with self.assertRaises(SystemExit) as ctx:
                    upload_to_drive.main()

        assert ctx.exception.code == 1

    @patch("upload_to_drive.run")
    def test_does_not_exit_on_success(self, mock_run):
        import upload_to_drive

        mock_run.return_value = UPLOAD_RESPONSE

        with tempfile.NamedTemporaryFile(suffix=".apk") as tmp:
            with patch.dict(os.environ, self._make_env(tmp.name)):
                try:
                    upload_to_drive.main()
                except SystemExit:
                    self.fail("main() raised SystemExit on success")


if __name__ == "__main__":
    unittest.main()
