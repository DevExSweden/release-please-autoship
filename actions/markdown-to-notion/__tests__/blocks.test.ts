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

  it("maps code blocks", () => {
    const node = { type: "code", lang: "ts", value: "const x = 1;" } as any;
    const block = mapNode(node) as any;
    expect(block.type).toBe("code");
    expect(block.code.language).toBe("ts");
    expect(block.code.rich_text[0].text.content).toBe("const x = 1;");
  });

  it("maps thematic breaks to divider", () => {
    const node = { type: "thematicBreak" } as any;
    const block = mapNode(node) as any;
    expect(block.type).toBe("divider");
  });
});


