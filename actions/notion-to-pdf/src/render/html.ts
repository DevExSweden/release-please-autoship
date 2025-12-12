import { BlockNode, RichText } from "../types/notion";

function joinRichTextPlain(rts: RichText[]): string {
  return rts.map((rt) => rt.plain_text).join("");
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderRichText(rts: RichText[]): string {
  return rts
    .map((rt) => {
      const text = escapeHtml(rt.plain_text);
      const styles: string[] = [];
      if (rt.annotations.bold) styles.push("font-weight:700");
      if (rt.annotations.italic) styles.push("font-style:italic");
      if (rt.annotations.underline) styles.push("text-decoration:underline");
      if (rt.annotations.strikethrough) styles.push("text-decoration:line-through");
      if (rt.annotations.code) styles.push("font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; background: #f6f6f7; padding: 0 .25em; border-radius: 4px");
      const color = rt.annotations.color;
      if (color && color !== "default") {
        if (!color.endsWith("_background")) {
          styles.push(`color: var(--notion-${color})`);
        }
      }
      const content = rt.href ? `<a href="${escapeHtml(rt.href)}">${text}</a>` : text;
      return `<span style="${styles.join(";")}">${content}</span>`;
    })
    .join("");
}

export function renderNodesToHtml(nodes: BlockNode[]): string {
  const htmlParts: string[] = [];

  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];
    const b = node.block;
    const t = b.type;
    if (t === "bulleted_list_item" || t === "numbered_list_item") {
      const isOrdered = t === "numbered_list_item";
      const tag = isOrdered ? "ol" : "ul";
      htmlParts.push(`<${tag}>`);
      while (
        i < nodes.length &&
        nodes[i].block.type === (isOrdered ? "numbered_list_item" : "bulleted_list_item")
      ) {
        const itemNode = nodes[i];
        const item = itemNode.block;
        const rich = (item[item.type]?.rich_text ?? []) as RichText[];
        const childHtml = itemNode.children.length ? renderNodesToHtml(itemNode.children) : "";
        htmlParts.push(`<li>${renderRichText(rich)}${childHtml ? `\n${childHtml}` : ""}</li>`);
        i++;
      }
      htmlParts.push(`</${tag}>`);
      continue;
    }

    if (t === "paragraph") {
      const rich = (b.paragraph?.rich_text ?? []) as RichText[];
      const childrenHtml = node.children.length ? renderNodesToHtml(node.children) : "";
      htmlParts.push(`<p>${renderRichText(rich)}</p>${childrenHtml}`);
    } else if (t === "heading_1") {
      const rich = (b.heading_1?.rich_text ?? []) as RichText[];
      const childrenHtml = node.children.length ? renderNodesToHtml(node.children) : "";
      htmlParts.push(`<h1>${renderRichText(rich)}</h1>${childrenHtml}`);
    } else if (t === "heading_2") {
      const rich = (b.heading_2?.rich_text ?? []) as RichText[];
      const childrenHtml = node.children.length ? renderNodesToHtml(node.children) : "";
      htmlParts.push(`<h2>${renderRichText(rich)}</h2>${childrenHtml}`);
    } else if (t === "heading_3") {
      const rich = (b.heading_3?.rich_text ?? []) as RichText[];
      const childrenHtml = node.children.length ? renderNodesToHtml(node.children) : "";
      htmlParts.push(`<h3>${renderRichText(rich)}</h3>${childrenHtml}`);
    } else if (t === "quote") {
      const rich = (b.quote?.rich_text ?? []) as RichText[];
      const childrenHtml = node.children.length ? renderNodesToHtml(node.children) : "";
      htmlParts.push(`<blockquote>${renderRichText(rich)}</blockquote>${childrenHtml}`);
    } else if (t === "code") {
      const rt = (b.code?.rich_text ?? []) as RichText[];
      const lang = b.code?.language || "";
      htmlParts.push(
        `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(joinRichTextPlain(rt))}</code></pre>`
      );
      if (node.children.length) {
        htmlParts.push(renderNodesToHtml(node.children));
      }
    } else if (t === "divider") {
      htmlParts.push(`<hr />`);
    } else if (t === "image") {
      const data = b.image;
      const src =
        data?.type === "external"
          ? data.external?.url
          : data?.file?.url;
      if (src) {
        htmlParts.push(`<figure><img src="${escapeHtml(src)}" /></figure>`);
      }
      if (node.children.length) {
        htmlParts.push(renderNodesToHtml(node.children));
      }
    } else if (t === "toggle") {
      const rich = (b.toggle?.rich_text ?? []) as RichText[];
      const childrenHtml = node.children.length ? renderNodesToHtml(node.children) : "";
      htmlParts.push(`<details><summary>${renderRichText(rich)}</summary>${childrenHtml}</details>`);
    } else if (t === "child_page") {
      const title = b.child_page?.title ? escapeHtml(b.child_page.title as string) : "Untitled";
      const childrenHtml = node.children.length ? renderNodesToHtml(node.children) : "";
      htmlParts.push(`<section><h2>${title}</h2>${childrenHtml}</section>`);
    } else {
      const rich = (b[t]?.rich_text ?? []) as RichText[];
      if (Array.isArray(rich) && rich.length > 0) {
        const childrenHtml = node.children.length ? renderNodesToHtml(node.children) : "";
        htmlParts.push(`<p>${renderRichText(rich)}</p>${childrenHtml}`);
      }
    }
    i++;
  }

  return htmlParts.join("\n");
}

export function buildHtmlDocument(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        --notion-red: #e03e3e;
        --notion-pink: #ad1a72;
        --notion-blue: #0b69a3;
        --notion-purple: #6940a5;
        --notion-teal: #0f7b6c;
        --notion-yellow: #dfab01;
        --notion-orange: #d9730d;
        --notion-brown: #64473a;
        --notion-gray: #9b9a97;
      }
      html, body {
        padding: 0;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        color: #1f2328;
        line-height: 1.6;
        font-size: 14px;
      }
      main {
        padding: 12mm;
      }
      h1, h2, h3 {
        line-height: 1.25;
        margin: 0 0 12px;
        page-break-after: avoid;
      }
      h1 { font-size: 28px; margin-top: 6px; }
      h2 { font-size: 22px; margin-top: 18px; }
      h3 { font-size: 18px; margin-top: 16px; }
      p, blockquote, pre, ul, ol, figure {
        margin: 0 0 12px;
      }
      blockquote {
        padding-left: 12px;
        border-left: 3px solid #e5e7eb;
        color: #475569;
      }
      pre {
        background: #0b1022;
        color: #e2e8f0;
        border-radius: 6px;
        padding: 12px;
        overflow: auto;
      }
      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      }
      img {
        max-width: 100%;
        height: auto;
        page-break-inside: avoid;
      }
      ul, ol {
        padding-left: 22px;
      }
      hr {
        border: none;
        border-top: 1px solid #e5e7eb;
        margin: 16px 0;
      }
      @page {
        margin: 12mm 12mm 16mm 12mm;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      ${inner}
    </main>
  </body>
</html>`;
}


