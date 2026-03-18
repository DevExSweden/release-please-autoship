# Extract Changelog

Extract changelog for a specific version from CHANGELOG.md.

## Supported format

- **Release Please**: `## [1.7.0](https://github.com/...) (2026-03-18)`

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `changelog-file-path` | Yes | Path to CHANGELOG.md |
| `version` | Yes | Version to extract (e.g. 1.19.0) |
| `output-file` | No | Output file path (default: `.release-changelog-v{version}.md`) |

## Outputs

| Output | Description |
|--------|-------------|
| `file` | Path to the extracted changelog file |
| `has_content` | Whether the file has content (`true`/`false`) |

## Usage

```yaml
- uses: sitoo/mobile-shared-cicd/actions/extract-changelog@main
  id: changelog
  with:
    changelog-file-path: CHANGELOG.md
    version: ${{ steps.version.outputs.version }}

- name: Use changelog
  if: steps.changelog.outputs.has_content == 'true'
  run: cat ${{ steps.changelog.outputs.file }}
```
