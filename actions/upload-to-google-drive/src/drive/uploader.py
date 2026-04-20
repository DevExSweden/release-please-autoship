"""Upload a single file to Google Drive using the Drive v3 API."""

from __future__ import annotations

import logging
import mimetypes

from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

logger = logging.getLogger(__name__)

_CHUNK_SIZE = 10 * 1024 * 1024  # 10 MB
_FOLDER_MIME = "application/vnd.google-apps.folder"


def find_or_create_folder(service, name: str, parent_id: str) -> str:
    """
    Return the ID of a folder named *name* inside *parent_id*.
    Creates it if it does not exist.
    """
    escaped = name.replace("'", "\\'")
    query = (
        f"name = '{escaped}'"
        f" and '{parent_id}' in parents"
        f" and mimeType = '{_FOLDER_MIME}'"
        " and trashed = false"
    )
    results = (
        service.files()
        .list(
            q=query,
            fields="files(id, name)",
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        )
        .execute()
    )
    files = results.get("files", [])
    if files:
        folder_id = files[0]["id"]
        logger.info("Found existing folder '%s' (id=%s)", name, folder_id)
        return folder_id

    folder_metadata = {
        "name": name,
        "mimeType": _FOLDER_MIME,
        "parents": [parent_id],
    }
    folder = (
        service.files()
        .create(body=folder_metadata, fields="id", supportsAllDrives=True)
        .execute()
    )
    folder_id = folder["id"]
    logger.info("Created folder '%s' (id=%s)", name, folder_id)
    return folder_id


def find_existing_file(service, name: str, folder_id: str) -> dict | None:
    """
    Return the Drive file resource if a file named *name* already exists in
    *folder_id*, or None if it does not.
    """
    escaped = name.replace("'", "\\'")
    query = (
        f"name = '{escaped}'"
        f" and '{folder_id}' in parents"
        f" and mimeType != '{_FOLDER_MIME}'"
        " and trashed = false"
    )
    results = (
        service.files()
        .list(
            q=query,
            fields="files(id, name, webViewLink)",
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        )
        .execute()
    )
    files = results.get("files", [])
    return files[0] if files else None


def upload_file(
    credentials,
    file_path: str,
    folder_id: str,
    file_name: str,
    subfolder: str = "",
) -> dict:
    """
    Upload *file_path* to the Google Drive folder identified by *folder_id*.

    If *subfolder* is given, a child folder with that name is found or created
    inside *folder_id*, and the file is uploaded there.

    Skips the upload and returns the existing file resource if a file with the
    same name already exists in the target folder.

    Returns the Drive file resource dict containing 'id', 'name', and 'webViewLink'.
    """
    service = build("drive", "v3", credentials=credentials)

    target_folder_id = folder_id
    if subfolder:
        logger.info("Resolving subfolder '%s' …", subfolder)
        target_folder_id = find_or_create_folder(service, subfolder, folder_id)

    existing = find_existing_file(service, file_name, target_folder_id)
    if existing:
        logger.info("Skipping upload – '%s' already exists (id=%s)", file_name, existing["id"])
        return existing

    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = "application/octet-stream"

    file_metadata = {
        "name": file_name,
        "parents": [target_folder_id],
    }
    media = MediaFileUpload(
        file_path,
        mimetype=mime_type,
        chunksize=_CHUNK_SIZE,
        resumable=True,
    )

    logger.info("Uploading '%s' to Drive folder %s …", file_name, target_folder_id)
    request = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id,name,webViewLink",
        supportsAllDrives=True,
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            logger.debug("%d%% …", int(status.progress() * 100))

    logger.info("Done – file ID: %s", response["id"])
    return response
