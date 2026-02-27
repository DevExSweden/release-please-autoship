import { describe, it, expect } from "vitest";
import { inline } from "../src/converter/inline";

describe("inline()", () => {
  it("maps plain text", () => {
    const nodes = [{ type: "text", value: "Hello" }];
    const rich = inline(nodes as any[]);
    expect(rich).toEqual([
      { type: "text", text: { content: "Hello" } }
    ]);
  });

  it("maps strong (bold) text", () => {
    const nodes = [
      { type: "strong", children: [{ type: "text", value: "Bold" }] }
    ];
    const rich = inline(nodes as any[]);
    expect(rich).toEqual([
      { type: "text", text: { content: "Bold" }, annotations: { bold: true } }
    ]);
  });

  it("maps emphasis (italic) text", () => {
    const nodes = [
      { type: "emphasis", children: [{ type: "text", value: "Italic" }] }
    ];
    const rich = inline(nodes as any[]);
    expect(rich).toEqual([
      { type: "text", text: { content: "Italic" }, annotations: { italic: true } }
    ]);
  });

  it("maps inlineCode", () => {
    const nodes = [{ type: "inlineCode", value: "x = 1" }];
    const rich = inline(nodes as any[]);
    expect(rich).toEqual([
      { type: "text", text: { content: "x = 1" }, annotations: { code: true } }
    ]);
  });

  it("composes nested strong + emphasis", () => {
    const nodes = [
      {
        type: "strong",
        children: [
          { type: "emphasis", children: [{ type: "text", value: "Both" }] }
        ]
      }
    ];
    const rich = inline(nodes as any[]);
    expect(rich).toEqual([
      { type: "text", text: { content: "Both" }, annotations: { bold: true, italic: true } }
    ]);
  });

  it("maps link nodes — renders text with url", () => {
    const nodes = [
      {
        type: "link",
        url: "https://example.com",
        children: [{ type: "text", value: "Click here" }]
      }
    ];
    const rich = inline(nodes as any[]);
    expect(rich).toEqual([
      {
        type: "text",
        text: { content: "Click here", link: { url: "https://example.com" } }
      }
    ]);
  });

  it("maps bold link — preserves annotations on link text", () => {
    const nodes = [
      {
        type: "strong",
        children: [
          {
            type: "link",
            url: "https://example.com",
            children: [{ type: "text", value: "Bold link" }]
          }
        ]
      }
    ];
    const rich = inline(nodes as any[]);
    expect(rich[0].annotations?.bold).toBe(true);
    expect(rich[0].text.link?.url).toBe("https://example.com");
  });
});


