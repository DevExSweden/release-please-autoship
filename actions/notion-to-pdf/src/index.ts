import * as core from "@actions/core";
import { chromium } from "playwright";
import { Client } from "@notionhq/client";
import * as fs from "fs";
import * as path from "path";

import { buildBlockTree } from "./notion/tree";
import { renderNodesToHtml, buildHtmlDocument } from "./render/html";
import { sanitizeFileName } from "./utils/strings";

async function run(): Promise<void> {
  try {
    const notionToken = core.getInput("notion_token", { required: true });
    const pageId = core.getInput("page_id", { required: true });
    const rawPageNameInput = core.getInput("page_name") || "";
    const pdfFormat = "A4";

    const notion = new Client({ auth: notionToken });
    const nodes = await buildBlockTree(notion, pageId);

    const pageUrl = `https://www.notion.so/${pageId.replace(/-/g, "")}`;
    const preferredTitleCandidate = rawPageNameInput && rawPageNameInput.trim()
      ? rawPageNameInput.trim()
      : "";
    const pageTitle = preferredTitleCandidate || "Notion Page";
    const outputFileName = `${sanitizeFileName(pageTitle)}.pdf`;
    const html = buildHtmlDocument(pageTitle, renderNodesToHtml(nodes));

    const browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-dev-shm-usage"]
    });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.emulateMedia({ media: "screen" });

      const pdfBuffer = await page.pdf({
        format: pdfFormat as any,
        printBackground: true,
        margin: { top: "12mm", right: "12mm", bottom: "16mm", left: "12mm" }
      });
      const outPath = path.resolve(process.cwd(), outputFileName);
      fs.writeFileSync(outPath, pdfBuffer);

      const stat = fs.statSync(outPath);
      core.setOutput("pdf_path", outPath);
      core.setOutput("pdf_file_name", outputFileName);
      core.setOutput("page_title", pageTitle);
      core.setOutput("page_url", pageUrl);
      core.setOutput("bytes_written", String(stat.size));
    } finally {
      await browser.close();
    }
  } catch (err: any) {
    core.setFailed(err?.message ?? String(err));
  }
}

run();


