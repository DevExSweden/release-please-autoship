import { describe, it, expect } from "vitest";
import { renderNodesToHtml, buildHtmlDocument, escapeHtml, renderRichText } from "../../src/render/html";
import { BlockNode, RichText } from "../../src/types/notion";

function rt(txt: string, opts: Partial<RichText["annotations"]> = {}): RichText {
  return {
    plain_text: txt,
    href: null,
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: "default",
      ...opts
    }
  };
}

describe("render/html", () => {
  it("escapes HTML", () => {
    expect(escapeHtml(`<div>"&</div>`)).toBe("&lt;div&gt;&quot;&amp;&lt;/div&gt;");
  });

  it("renders rich text with basic annotations", () => {
    const out = renderRichText([rt("Bold", { bold: true }), rt(" and "), rt("Italic", { italic: true })]);
    expect(out).toContain("font-weight:700");
    expect(out).toContain("font-style:italic");
  });

  it("renders headings, paragraphs, and lists with children", () => {
    const nodes: BlockNode[] = [
      { block: { id: "1", type: "heading_1", heading_1: { rich_text: [rt("Title")] } }, children: [] },
      { block: { id: "2", type: "paragraph", paragraph: { rich_text: [rt("Hello")] } }, children: [] },
      { block: { id: "3", type: "bulleted_list_item", bulleted_list_item: { rich_text: [rt("Item 1")] } }, children: [] },
      { block: { id: "4", type: "bulleted_list_item", bulleted_list_item: { rich_text: [rt("Item 2")] } }, children: [] },
      {
        block: { id: "5", type: "toggle", toggle: { rich_text: [rt("More")] } },
        children: [
          { block: { id: "6", type: "paragraph", paragraph: { rich_text: [rt("Hidden text")] } }, children: [] }
        ]
      }
    ];
    const html = renderNodesToHtml(nodes);
    expect(html).toContain("<h1>");
    expect(html).toContain("<p><span");
    expect(html).toContain(">Hello<");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
    expect(html).toContain("<details>");
    expect(html).toContain("Hidden text");
  });

  it("renders Notion tables", () => {
    const nodes: BlockNode[] = [
      {
        block: { id: "t", type: "table", table: { has_column_header: true, has_row_header: false } },
        children: [
          {
            block: {
              id: "tr1",
              type: "table_row",
              table_row: { cells: [[rt("Field")], [rt("Value")]] }
            },
            children: []
          },
          {
            block: {
              id: "tr2",
              type: "table_row",
              table_row: { cells: [[rt("Version")], [rt("1.2.3")]] }
            },
            children: []
          }
        ]
      }
    ];
    const html = renderNodesToHtml(nodes);
    expect(html).toContain("<table");
    expect(html).toContain("<thead>");
    expect(html).toContain("<th>");
    expect(html).toContain("Field");
    expect(html).toContain("<tbody>");
    expect(html).toContain("Version");
    expect(html).toContain("1.2.3");
  });

  it("wraps content in an HTML document template", () => {
    const doc = buildHtmlDocument("Report", "<p>Body</p>");
    expect(doc).toContain("<!DOCTYPE html>");
    expect(doc).toContain("<title>Report</title>");
    expect(doc).toContain("<p>Body</p>");
  });
});


