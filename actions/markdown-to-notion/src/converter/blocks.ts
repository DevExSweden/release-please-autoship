import type { RootContent, Paragraph, Heading, List, ListItem, Code, Table, TableRow, TableCell } from "mdast";
import type { BlockObjectRequest } from "./types";
import { inline } from "./inline";

const MAX_RICH_TEXT_LENGTH = 2000;

function chunkText(value: string): string[] {
	if (value.length <= MAX_RICH_TEXT_LENGTH) return [value];
	const chunks: string[] = [];
	for (let i = 0; i < value.length; i += MAX_RICH_TEXT_LENGTH) {
		chunks.push(value.slice(i, i + MAX_RICH_TEXT_LENGTH));
	}
	return chunks;
}

export function mapNode(node: RootContent): BlockObjectRequest | BlockObjectRequest[] | null {
	switch (node.type) {
		case "heading":   return heading(node as Heading);
		case "paragraph": return paragraph(node as Paragraph);
		case "list":      return list(node as List);
		case "code":      return code(node as Code);
		case "table":     return table(node as Table);
		case "thematicBreak": return divider();
		default: return null;
	}
}

function heading(node: Heading): BlockObjectRequest {
	const level = node.depth;
	const type = level === 1 ? "heading_1" : level === 2 ? "heading_2" : "heading_3";

	return {
		object: "block",
		type,
		[type]: {
			rich_text: inline(node.children)
		}
	};
}

function paragraph(node: Paragraph): BlockObjectRequest | null {
	const rich = inline(node.children);
	if (!rich.length) return null;

	return {
		object: "block",
		type: "paragraph",
		paragraph: { rich_text: rich }
	};
}

function list(node: List): BlockObjectRequest[] {
	const ordered = node.ordered === true;
	const blocks: BlockObjectRequest[] = [];

	for (const li of node.children as ListItem[]) {
		const para = li.children.find(child => child.type === "paragraph") as Paragraph;
		const rich = para ? inline(para.children) : [];
		const type = ordered ? "numbered_list_item" : "bulleted_list_item";

		blocks.push({
			object: "block",
			type,
			[type]: { rich_text: rich }
		});
	}

	return blocks;
}

function code(node: Code): BlockObjectRequest {
	return {
		object: "block",
		type: "code",
		code: {
			language: node.lang || "text",
			rich_text: chunkText(node.value).map(chunk => ({
				type: "text",
				text: { content: chunk }
			}))
		}
	};
}

function table(node: Table): BlockObjectRequest {
	const rows = node.children as TableRow[];
	const tableWidth = rows.length > 0
		? (rows[0].children as TableCell[]).length
		: 0;

	const children = rows.map((row) => {
		const cells = (row.children as TableCell[]).map((cell) =>
			inline(cell.children)
		);
		return {
			object: "block" as const,
			type: "table_row" as const,
			table_row: { cells }
		};
	});

	return {
		object: "block",
		type: "table",
		table: {
			table_width: tableWidth,
			has_column_header: true,
			has_row_header: false,
			children
		}
	};
}

function divider(): BlockObjectRequest {
	return { object: "block", type: "divider", divider: {} };
}


