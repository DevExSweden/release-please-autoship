import { describe, it, expect } from "vitest";
import { mapNode } from "../src/converter/blocks";

describe("mapNode()", () => {
  it("maps heading levels", () => {
    const node = {
      type: "heading",
      depth: 1,
      children: [{ type: "text", value: "Title" }]
    } as any;
    const block = mapNode(node) as any;
    expect(block.type).toBe("heading_1");
    expect(block.heading_1.rich_text[0].text.content).toBe("Title");
  });

  it("maps paragraph with inline rich text", () => {
    const node = {
      type: "paragraph",
      children: [
        { type: "text", value: "Hello " },
        { type: "strong", children: [{ type: "text", value: "World" }] },
      ]
    } as any;
    const block = mapNode(node) as any;
    expect(block.type).toBe("paragraph");
    const texts = block.paragraph.rich_text.map((r: any) => r.text.content).join("");
    expect(texts).toBe("Hello World");
    expect(block.paragraph.rich_text[1].annotations.bold).toBe(true);
  });

  it("returns null for empty paragraph", () => {
    const node = { type: "paragraph", children: [] } as any;
    const block = mapNode(node);
    expect(block).toBeNull();
  });

  it("maps bulleted list items", () => {
    const node = {
      type: "list",
      ordered: false,
      children: [
        {
          type: "listItem",
          children: [
            { type: "paragraph", children: [{ type: "text", value: "Item 1" }] }
          ]
        },
        {
          type: "listItem",
          children: [
            { type: "paragraph", children: [{ type: "text", value: "Item 2" }] }
          ]
        }
      ]
    } as any;
    const blocks = mapNode(node) as any[];
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("bulleted_list_item");
    expect(blocks[0].bulleted_list_item.rich_text[0].text.content).toBe("Item 1");
  });

  it("maps numbered list items", () => {
    const node = {
      type: "list",
      ordered: true,
      children: [
        {
          type: "listItem",
          children: [
            { type: "paragraph", children: [{ type: "text", value: "First" }] }
          ]
        }
      ]
    } as any;
    const blocks = mapNode(node) as any[];
    expect(blocks[0].type).toBe("numbered_list_item");
  });

  it("maps code blocks with explicit language", () => {
    const node = { type: "code", lang: "ts", value: "const x = 1;" } as any;
    const block = mapNode(node) as any;
    expect(block.type).toBe("code");
    expect(block.code.language).toBe("ts");
    expect(block.code.rich_text[0].text.content).toBe("const x = 1;");
  });

  it("maps code blocks with lang 'text' to 'plain text' for Notion compatibility", () => {
    const node = { type: "code", lang: "text", value: "some plain text" } as any;
    const block = mapNode(node) as any;
    expect(block.code.language).toBe("plain text");
  });

  it("maps code blocks with no lang to 'plain text' for Notion compatibility", () => {
    const node = { type: "code", lang: null, value: "some plain text" } as any;
    const block = mapNode(node) as any;
    expect(block.code.language).toBe("plain text");
  });

  it("chunks oversized code block value into multiple rich_text entries", () => {
    const longValue = "x".repeat(4500);
    const node = { type: "code", lang: "ts", value: longValue } as any;
    const block = mapNode(node) as any;
    expect(block.type).toBe("code");
    expect(block.code.rich_text.length).toBe(3);
    expect(block.code.rich_text[0].text.content.length).toBe(2000);
    expect(block.code.rich_text[1].text.content.length).toBe(2000);
    expect(block.code.rich_text[2].text.content.length).toBe(500);
  });

  it("maps thematic breaks to divider", () => {
    const node = { type: "thematicBreak" } as any;
    const block = mapNode(node) as any;
    expect(block.type).toBe("divider");
  });

  it("maps table to Notion table block", () => {
    const node = {
      type: "table",
      children: [
        {
          type: "tableRow",
          children: [
            { type: "tableCell", children: [{ type: "text", value: "Area" }] },
            { type: "tableCell", children: [{ type: "text", value: "Change" }] },
          ]
        },
        {
          type: "tableRow",
          children: [
            { type: "tableCell", children: [{ type: "text", value: "Payments" }] },
            { type: "tableCell", children: [{ type: "text", value: "New flow" }] },
          ]
        }
      ]
    } as any;

    const block = mapNode(node) as any;
    expect(block.type).toBe("table");
    expect(block.table.table_width).toBe(2);
    expect(block.table.has_column_header).toBe(true);
    expect(block.table.children).toHaveLength(2);
    expect(block.table.children[0].type).toBe("table_row");
    expect(block.table.children[0].table_row.cells[0][0].text.content).toBe("Area");
    expect(block.table.children[1].table_row.cells[0][0].text.content).toBe("Payments");
  });
});


