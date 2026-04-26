## Conventional Commit with Ticket (Composite Action)

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
  - Controlled by the `ticket-key-pattern` input — if not set, ticket validation is skipped entirely.
  - When set, a matching ticket key is required for the types listed in `ticket-required-types` (default: `feat`, `fix`, `perf`, `security`, `refactor`).
- **Labels on success**:
  - Adds a type label (e.g., `feat` → `feature`, `perf` → `performance`, `wip` → `WIP`)
  - Adds a scope label when a scope is present in the title

### Inputs

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `app-token` | **yes** | — | GitHub App installation token for PR interactions (labels/comments). Needs `pull-requests: write`. |
| `ticket-key-pattern` | no | _(empty)_ | Regex pattern a ticket key must match (e.g. `(PROJ\|TEAM)-[0-9]{2,5}`). When omitted, ticket validation is skipped. |
| `require-ticket-for-types` | no | `feat,fix,perf,security,refactor` | Comma-separated commit types that require a ticket key. Only used when `ticket-key-pattern` is set. |

### Usage

#### Without ticket key validation

```yaml
name: Conventional Commit Check

on:
  pull_request:
    types: [opened, reopened, edited]

jobs:
  conventional-commit:
    runs-on: ubuntu-latest
    steps:
      - name: Validate conventional commits
        uses: DevExSweden/conventional-commit-with-ticket@main
        with:
          app-token: ${{ secrets.GITHUB_TOKEN }}
```

#### With ticket key validation

```yaml
      - name: Validate conventional commits
        uses: DevExSweden/conventional-commit-with-ticket@main
        with:
          app-token: ${{ steps.app-token.outputs.token }}
          ticket-key-pattern: "(PROJ|TEAM)-[0-9]{2,5}"
          require-ticket-for-types: "feat,fix,perf,security,refactor"
```

### Outputs
- This action relies on the underlying validator and does not emit custom outputs.


### Troubleshooting
- Labels not added: Ensure the GitHub App token has `pull_requests: write` and is passed via `app-token`.
- Validation details missing: See the job summary; ensure the workflow runs on `pull_request` events.
- Title rejected: Check Conventional Commit format and whether a ticket key is required for the given type.

