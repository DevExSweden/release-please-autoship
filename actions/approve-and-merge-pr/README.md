## Approve and Merge PR (Composite Action)

Approve and automatically merge a pull request using a dual-identity pattern: the built-in `GITHUB_TOKEN` approves the PR (satisfying branch-protection review requirements), while the GitHub App token enables and completes the merge (so the approver and merger are different identities).

### What this action does

1. Approves the PR using the built-in `GITHUB_TOKEN` via `gh pr review --approve`.
2. Enables auto-merge on the PR using the GitHub App token via `gh pr merge --auto`.
3. If branch protection is not configured and auto-merge is unavailable, falls back to a direct merge.
4. Optionally deletes the source branch after merge.

### Inputs

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `pr-number` | **yes** | — | The number of the pull request to approve and merge. |
| `github-app-token` | **yes** | — | GitHub App token used to enable and complete the merge. |
| `merge-method` | no | `squash` | Merge strategy: `squash`, `merge`, or `rebase`. |
| `delete-branch` | no | `true` | Delete the source branch after the PR is merged. |

### Usage

```yaml
- name: Auto-merge PR
  uses: DevExSweden/approve-and-merge-pr@v1.0.0
  with:
    pr-number: ${{ steps.release-please.outputs.pr_number }}
    github-app-token: ${{ steps.app-token.outputs.token }}
```

#### Keep the source branch after merge

```yaml
- name: Auto-merge PR
  uses: DevExSweden/approve-and-merge-pr@v1.0.0
  with:
    pr-number: ${{ steps.release-please.outputs.pr_number }}
    github-app-token: ${{ steps.app-token.outputs.token }}
    delete-branch: "false"
```

#### Use rebase instead of squash

```yaml
- name: Auto-merge PR
  uses: DevExSweden/approve-and-merge-pr@v1.0.0
  with:
    pr-number: ${{ steps.release-please.outputs.pr_number }}
    github-app-token: ${{ steps.app-token.outputs.token }}
    merge-method: rebase
```

### How the dual-identity pattern works

Branch protection rules typically require that the person who opened a PR cannot be the one who approves it. This action solves that by splitting the two operations across two identities:

```
GITHUB_TOKEN  ──►  gh pr review --approve     (approves as the workflow actor)
App token     ──►  gh pr merge --auto          (merges as the GitHub App)
```

This means the PR opener, the approver, and the merger can all be distinct identities, satisfying even strict branch-protection policies.

### Requirements and permissions

**Job-level permissions** (add to the calling workflow job):

```yaml
permissions:
  pull-requests: write   # required to approve and merge the PR
  contents: write        # required to delete the branch after merge
```

**GitHub App** must have the following repository permissions:

| Permission | Access |
|------------|--------|
| `Pull requests` | Read & write |
| `Contents` | Read & write |
| `Metadata` | Read |

**Runtime dependencies**: the action uses the `gh` CLI (pre-installed on all GitHub-hosted runners).

### Troubleshooting

- **Approval fails**: The `GITHUB_TOKEN` must have `pull-requests: write` permission. Check the `permissions` block in your workflow.
- **Auto-merge not available**: If the repository does not have branch protection configured, the action automatically falls back to a direct merge — no manual intervention needed.
- **Merge fails with "Required status checks"**: Auto-merge will wait for all required checks to pass before merging. If a required check never completes, the merge will remain pending.
- **Branch not deleted**: Ensure `contents: write` is set in the job permissions and `delete-branch` is not set to `"false"`.
