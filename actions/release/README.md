## Copilot Release Notes (Composite Action)

Generate release notes with GitHub Copilot, upload them as a workflow artifact, and post a Slack message containing a direct link to the artifact.

### What this action does
- Builds a Copilot prompt from a target-specific template and the provided tags
- Invokes the Copilot CLI to generate "<target-name>-release-notes.md"
- Uploads the generated file as an artifact
- Posts a Slack message with a link to the artifact

### Inputs
- **target-name** (required): Name of the target (e.g. `sitoo`, `varner`). Must match a prompt file at `actions/release/prompts/<target-name>-release-notes.md`.
- **slack-title** (optional, default: `Notes for Sitoo Public release`): Title used in the Slack message.
- **current-tag** (required): The current release tag (e.g. `v2.3.0`).
- **previous-tag** (required): The previous release tag (e.g. `v2.2.0`).
- **github-token** (required): A GitHub token (PAT) with `copilot-requests` scope for the Copilot CLI.
- **slack-token** (required): Slack token for posting messages.
- **slack-channel** (required): Slack channel ID or name to receive the message.

### Outputs
- **artifact-url**: URL to the uploaded release notes artifact for this workflow run.

### Usage
Add a job step in your workflow that uses this action and provides the required inputs. Example:

```yaml
name: Release Notes

on:
  workflow_dispatch:
    inputs:
      current:
        description: Current tag
        required: true
      previous:
        description: Previous tag
        required: true

jobs:
  release-notes:
    runs-on: ubuntu-latest
    steps:
      - name: Generate and share release notes
        uses: sitoo/mobile-shared-cicd/actions/release@simplify_workflow
        with:
          target-name: sitoo
          slack-title: Notes for Sitoo Public release
          current-tag: ${{ inputs.current }}
          previous-tag: ${{ inputs.previous }}
          github-token: ${{ secrets.COPILOT_GITHUB_TOKEN }}
          slack-token: ${{ secrets.SLACK_BOT_TOKEN }}
          slack-channel: ${{ secrets.SLACK_CHANNEL }}
```

### Prompt templates
Prompt files live under:
- `actions/release/prompts/sitoo-release-notes.md`
- `actions/release/prompts/varner-release-notes.md`

To add a new target, create a file named `actions/release/prompts/<target-name>-release-notes.md` and pass that `<target-name>` as input.

### Artifacts
- Generated file name: "<target-name>-release-notes.md"
- Uploaded artifact name: "<target-name>-release-notes"
- The action emits `artifact-url`, which is also posted to Slack.

### Requirements and permissions
- A GitHub Personal Access Token (PAT) with `copilot-requests` scope available to the job and passed via `github-token`.
- A Slack token with permissions to post to the specified channel.

### Troubleshooting
- **Missing prompt file**: Ensure `actions/release/prompts/<target-name>-release-notes.md` exists.
- **Unauthorized Copilot request**: Verify the PAT used for `github-token` has the `copilot-requests` scope and is not rate-limited.
- **Slack message not posted**: Check `slack-token` validity and that the token can post to `slack-channel`.

