"""
Orchestration and CLI entrypoint for upload-to-google-drive.

Credentials are provided at runtime via Application Default Credentials,
set up by the google-github-actions/auth step (Workload Identity Federation).

Required environment variables:
  FILE_PATH   – local path to the file to upload
  FOLDER_ID   – Google Drive folder ID

Optional environment variables:
  FILE_NAME   – override the uploaded filename (defaults to basename of FILE_PATH)
  SUBFOLDER   – name of a version subfolder to find or create inside FOLDER_ID

Written to GITHUB_OUTPUT (when present):
  file-id       – the Google Drive file ID of the uploaded file
  web-view-link – the Google Drive web view link for the uploaded file
"""

from __future__ import annotations

import os
import sys

from drive.auth import load_credentials
from drive.uploader import upload_file


def run(
    file_path: str,
    folder_id: str,
    file_name: str = "",
    subfolder: str = "",
    github_output_path: str = "",
) -> dict:
    """
    Upload *file_path* to the Google Drive folder identified by *folder_id*.

    If *subfolder* is given, a child folder with that name is found or created
    inside *folder_id* before uploading.

    Returns the Drive file resource dict containing 'id' and 'webViewLink'.
    """
    if not file_name:
        file_name = os.path.basename(file_path)

    credentials = load_credentials()
    result = upload_file(credentials, file_path, folder_id, file_name, subfolder)

    if github_output_path:
        with open(github_output_path, "a") as fh:
            fh.write(f"file-id={result['id']}\n")
            fh.write(f"web-view-link={result.get('webViewLink', '')}\n")

    return result


def main() -> None:
    try:
        file_path = os.environ.get("FILE_PATH", "").strip()
        if not file_path:
            raise ValueError("FILE_PATH must be set.")
        if not os.path.isfile(file_path):
            raise ValueError(f"FILE_PATH does not exist or is not a file: {file_path!r}")

        folder_id = os.environ.get("FOLDER_ID", "").strip()
        if not folder_id:
            raise ValueError("FOLDER_ID must be set.")

        result = run(
            file_path=file_path,
            folder_id=folder_id,
            file_name=os.environ.get("FILE_NAME", "").strip(),
            subfolder=os.environ.get("SUBFOLDER", "").strip(),
            github_output_path=os.environ.get("GITHUB_OUTPUT", ""),
        )
        print(f"\nUploaded: {result['name']}")
        print(f"File ID:  {result['id']}")
        if result.get("webViewLink"):
            print(f"Link:     {result['webViewLink']}")

    except (ValueError, RuntimeError) as exc:
        print(f"ERROR: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
