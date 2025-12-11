import type { RichTextItemRequest } from "./types";

export function inline(nodes: any[]): RichTextItemRequest[] {
	const result: RichTextItemRequest[] = [];

	for (const n of nodes) {
		if (n.type === "text") {
			result.push({
				type: "text",
				text: { content: n.value }
			});
		}
		if (n.type === "strong") {
			inline(n.children).forEach(rt => {
				rt.annotations = { ...(rt.annotations || {}), bold: true };
				result.push(rt);
			});
		}
		if (n.type === "emphasis") {
			inline(n.children).forEach(rt => {
				rt.annotations = { ...(rt.annotations || {}), italic: true };
				result.push(rt);
			});
		}
		if (n.type === "inlineCode") {
			result.push({
				type: "text",
				text: { content: n.value },
				annotations: { code: true }
			});
		}
	}

	return result;
}


