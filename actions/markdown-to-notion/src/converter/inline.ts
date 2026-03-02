import type { RichTextItemRequest } from "./types";

const MAX_RICH_TEXT_LENGTH = 2000;

function chunkText(value: string): string[] {
	if (value.length <= MAX_RICH_TEXT_LENGTH) return [value];
	const chunks: string[] = [];
	for (let i = 0; i < value.length; i += MAX_RICH_TEXT_LENGTH) {
		chunks.push(value.slice(i, i + MAX_RICH_TEXT_LENGTH));
	}
	return chunks;
}

function pushChunked(
	result: RichTextItemRequest[],
	value: string,
	annotations?: Record<string, boolean>
): void {
	for (const chunk of chunkText(value)) {
		const item: RichTextItemRequest = {
			type: "text",
			text: { content: chunk }
		};
		if (annotations) item.annotations = annotations;
		result.push(item);
	}
}

export function inline(nodes: any[]): RichTextItemRequest[] {
	const result: RichTextItemRequest[] = [];

	for (const n of nodes) {
		if (n.type === "text") {
			pushChunked(result, n.value);
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
			pushChunked(result, n.value, { code: true });
		}
		if (n.type === "link") {
			// Render link children as rich text with a URL on each entry
			inline(n.children).forEach(rt => {
				rt.text = { ...(rt.text || {}), link: { url: n.url } };
				result.push(rt);
			});
		}
	}

	return result;
}


