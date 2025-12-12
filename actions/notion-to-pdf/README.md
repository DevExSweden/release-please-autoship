## Notion Page → PDF (GitHub Action)

Export a Notion page to a PDF file during your workflows. This action authenticates with Notion, renders the page using a headless browser, and saves a PDF to your workspace.

### Inputs
- **notion_token** (required): Notion integration token. Provide via `secrets`.
- **page_id** (required): Notion page ID to export.
- **page_name** (required): Display name for the page (used for PDF title and filename).

### Outputs
- **pdf_path**: Path to the written PDF.

### Usage
Minimal example:

```yaml
name: Export Notion Page to PDF
on:
  workflow_dispatch:
    inputs:
      page_id:
        description: "Notion Page ID"
        required: true
        

jobs:
  export:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      # Install a Chromium for headless rendering
      - name: Install Playwright Chromium (recommended)
        run: |
          npx --yes playwright install --with-deps chromium

      - name: Notion → PDF
        uses: ./actions/notion-to-pdf
        with:
          notion_token: ${{ secrets.NOTION_TOKEN }}
          page_id: ${{ github.event.inputs.page_id }}
          page_name: "Exported Page Title"

      - name: Upload PDF artifact
        uses: actions/upload-artifact@v4
        with:
          name: notion-pdf
          path: Exported Page Title.pdf
```

Notes:
- This action expects a headless browser to be present. Installing Playwright Chromium (as above) is the recommended approach for consistent results across runners.
- Do not print your `notion_token` to logs. Use it only as an input via `secrets`.

### Local development
```bash
cd actions/notion-to-pdf
npm ci
npm run build
```

Commit the generated `dist/` so workflows can consume the action without installing dependencies.

### Release checklist
- [ ] Implement logic in `src/index.ts` (avoid logging sensitive data).
- [ ] Ensure `npm run build` produces `dist/index.js`.
- [ ] Add tests under `__tests__/` and run `npm test`.
- [ ] Update examples and inputs/outputs in this README if changed.
- [ ] Commit `dist/` for the action to be runnable by GitHub.


