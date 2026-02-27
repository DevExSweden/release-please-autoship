import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import type { BlockObjectRequest } from "./types";
import { mapNode } from "./blocks";

/**
 * If a line looks like a collapsed markdown table (all rows concatenated on
 * one line, e.g. produced when GitHub Actions collapses multiline outputs),
 * expand it back into proper multi-line markdown so that remark-gfm can
 * parse it as a table.
 *
 * Example input (one line):
 *   | Area | Change | |---|---| | Payments | New flow |
 *
 * Example output (three lines):
 *   | Area | Change |
 *   |---|---|
 *   | Payments | New flow |
 *
 * Strategy:
 *  1. Split the line on `|` to get raw "parts".
 *  2. Locate the separator row (parts matching /^\s*-+\s*$/) and count columns.
 *  3. Rebuild rows by taking `colCount` parts at a time, skipping the
 *     whitespace-only boundary parts that sit between rows.
 */
function expandCollapsedTableLine(line: string): string {
	const trimmed = line.trim();

	// Quick exit: must start/end with `|` and contain a `|---|` pattern
	if (!trimmed.startsWith("|") || !trimmed.endsWith("|") || !/\|\s*-+\s*\|/.test(trimmed)) {
		return line;
	}

	const parts = trimmed.split("|");
	// parts[0] = "" (before leading |), parts[last] = "" (after trailing |)
	// Inner parts are the cell contents and row-boundary empty slots.

	// Find the separator row parts (dashes only), determine column count
	const isSep = (p: string) => /^\s*-+\s*$/.test(p);
	const firstSepIdx = parts.findIndex(isSep);
	if (firstSepIdx === -1) return line;

	let sepEnd = firstSepIdx;
	while (sepEnd + 1 < parts.length && isSep(parts[sepEnd + 1])) sepEnd++;
	const colCount = sepEnd - firstSepIdx + 1;

	// Walk the inner parts (index 1 to length-2), skip whitespace-only boundary
	// slots, and collect colCount-sized groups as rows
	const rows: string[] = [];
	let i = 1;
	while (i <= parts.length - 2) {
		// Skip whitespace-only boundary parts (they sit between rows, not inside them)
		if (parts[i].trim() === "" && rows.length > 0) {
			i++;
			continue;
		}
		// Skip the separator row itself — we'll re-generate it
		if (isSep(parts[i])) {
			i += colCount;
			continue;
		}
		// Collect colCount cells for one data/header row
		const cells = parts.slice(i, i + colCount);
		if (cells.length === colCount) {
			rows.push("|" + cells.join("|") + "|");
			i += colCount;
		} else {
			i++;
		}
	}

	if (rows.length === 0) return line;

	// Re-build: header row, separator, data rows
	const sep = "|" + Array(colCount).fill("---|").join("");
	return [rows[0], sep, ...rows.slice(1)].join("\n");
}

function normalizeMarkdown(markdown: string): string {
	return markdown
		.split("\n")
		.map(expandCollapsedTableLine)
		.join("\n");
}

export function markdownToNotionBlocks(markdown: string): BlockObjectRequest[] {
	const normalized = normalizeMarkdown(markdown);
	const tree = unified().use(remarkParse).use(remarkGfm).parse(normalized) as Root;

	const blocks: BlockObjectRequest[] = [];
	for (const node of tree.children) {
		const result = mapNode(node as RootContent);
		if (!result) continue;
		if (Array.isArray(result)) blocks.push(...result);
		else blocks.push(result);
	}
	return blocks;
}
