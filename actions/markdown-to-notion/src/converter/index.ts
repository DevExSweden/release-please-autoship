import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root, RootContent } from "mdast";
import type { BlockObjectRequest } from "./types";
import { mapNode } from "./blocks";

export function markdownToNotionBlocks(markdown: string): BlockObjectRequest[] {
	const tree = unified().use(remarkParse).parse(markdown) as Root;

	const blocks: BlockObjectRequest[] = [];
	for (const node of tree.children) {
		const result = mapNode(node as RootContent);
		if (!result) continue;
		if (Array.isArray(result)) blocks.push(...result);
		else blocks.push(result);
	}
	return blocks;
}
