## Slack Upload File (GitHub Action)

Uploads a file to Slack using `files.uploadV2`.

### Inputs
- `slack_token` (required): Bot token with `files:write`, `chat:write`, `channels:read`, and `groups:read` (for channel name resolution).
- `channel` (required): Channel name (e.g. `releases`, `#releases`). Resolved via conversations.list.
- `file_path` (required): Path to the file to upload.
- `file_name` (optional): Display name on Slack (defaults to basename of `file_path`).
- `initial_comment` (optional): Message text attached to the file.
- `title` (optional): File title in Slack.

### Outputs
- `file_id`: Uploaded file ID.
- `permalink`: Permalink to the uploaded file.

### Example
```yaml
- name: Upload PDF to Slack
  uses: ./actions/slack-upload-file
  with:
    slack_token: ${{ secrets.SLACK_BOT_TOKEN }}
    channel: releases
    file_path: path/to/file.pdf
    file_name: file.pdf
    initial_comment: "Here is the latest report"
```


