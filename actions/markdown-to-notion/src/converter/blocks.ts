import type { RootContent, Paragraph, Heading, List, ListItem, Code } from "mdast";
import type { BlockObjectRequest } from "./types";
import { inline } from "./inline";

export function mapNode(node: RootContent): BlockObjectRequest | BlockObjectRequest[] | null {
	switch (node.type) {
		case "heading":   return heading(node as Heading);
		case "paragraph": return paragraph(node as Paragraph);
		case "list":      return list(node as List);
		case "code":      return code(node as Code);
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
			rich_text: [
				{
					type: "text",
					text: { content: node.value }
				}
			]
		}
	};
}

function divider(): BlockObjectRequest {
	return { object: "block", type: "divider", divider: {} };
}


