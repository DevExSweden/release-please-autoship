## Conventional Commit (Composite Action)

Validate pull request titles against the Conventional Commits specification with centrally managed rules.

### What this action does
- Validates Conventional Commits on the PR title via `ytanikin/pr-conventional-commits@1.4.2`.
- Enforces a ticket key in the title for specific types (see Rules).
- Adds type and scope labels to the PR when validation passes.
- Fails the job when validation fails and writes details to the job summary.

### Why centralize the rules
The idea is to manage the rules from one place. By keeping the allowed types and ticket pattern here, every repository that uses this action inherits the same standards without duplicating configuration. Updating the rules in this action updates them for all consumers.

### Rules enforced
- **Allowed types**: `feat`, `fix`, `docs`, `test`, `ci`, `refactor`, `perf`, `chore`, `revert`, `security`, `wip`
- **Ticket key requirement**:
  - Required for types: `feat`, `fix`, `perf`, `security`, `refactor`
  - Not required for: `docs`, `test`, `chore`, `wip`, `revert`, `ci`, others
  - Pattern: `(POSS|PS|BUGS|COM|PROM|APPE)-\d{2,5}`
  - Examples: `POSS-123`, `PS-42`, `BUGS-9999`, `COM-77`, `PROM-200`
- **Labels on success**:
  - Adds a type label (e.g., `feat` → `feature`, `perf` → `performance`, `wip` → `WIP`)
  - Adds a scope label when a scope is present in the title

### Inputs
- `app-token` (required): GitHub App installation token used for validation and PR interactions (labels/comments).  
  - Recommended: Generate via `actions/create-github-app-token@v1` with `pull-requests: write` and `contents: read` permissions.

### Usage
Add a job step in your workflow to invoke this action:

```yaml
name: Conventional Commit Check

on:
  pull_request:
    types: [opened, reopened, edited]

jobs:
  conventional-commit:
    runs-on: ubuntu-latest
    steps:
      - name: Generate GitHub App token
        id: app-token
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}

      - name: Validate conventional commits
        uses: sitoo/mobile-shared-cicd/actions/conventional-commit@main
        with:
          app-token: ${{ steps.app-token.outputs.token }}
```

### Outputs
- This action relies on the underlying validator and does not emit custom outputs.


### Troubleshooting
- Labels not added: Ensure the GitHub App token has `pull_requests: write` and is passed via `app-token`.
- Validation details missing: See the job summary; ensure the workflow runs on `pull_request` events.
- Title rejected: Check Conventional Commit format and whether a ticket key is required for the given type.

