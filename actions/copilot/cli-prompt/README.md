# Copilot CLI Prompt Runner

Runs GitHub Copilot CLI using provided prompt text and writes the output to a file and a workflow output.

## Inputs
- **prompt-text** (required): Prompt instructions for Copilot.  
- **output-file** (optional): Output path (default: `copilot-output.md`).  
- **github-token** (required): A **PAT with the `copilot-requests` scope**, used for Copilot CLI authentication.
- **timeout** (optional): Timeout (default: `600s`).  

## Outputs
- **report**: Full Copilot-generated output.

## Usage
```yaml
uses: sitoo/mobile-cicd/actions/copilot/cli-prompt@main
with:
  prompt-text: "Analyze the PR and summarize risk."
  output-file: "copilot-report.md"
  github-token: ${{ secrets.COPILOT_CI_PAT }}
