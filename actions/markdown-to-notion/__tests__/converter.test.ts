import { describe, it, expect } from "vitest";
import { markdownToNotionBlocks } from "../src/converter";

describe("markdownToNotionBlocks() — collapsed table normalisation", () => {
  it("parses a normal multi-line table", () => {
    const md = `| Area | Change |\n|---|---|\n| Payments | New flow |`;
    const blocks = markdownToNotionBlocks(md);
    expect(blocks[0].type).toBe("table");
    expect(blocks[0].table.children).toHaveLength(2);
    expect(blocks[0].table.children[0].table_row.cells[0][0].text.content).toBe("Area");
    expect(blocks[0].table.children[1].table_row.cells[0][0].text.content).toBe("Payments");
  });

  it("parses a collapsed single-line table", () => {
    const md = `| Area | Change | |---|---| | Payments | New flow |`;
    const blocks = markdownToNotionBlocks(md);
    expect(blocks[0].type).toBe("table");
    expect(blocks[0].table.children).toHaveLength(2);
    expect(blocks[0].table.children[0].table_row.cells[0][0].text.content).toBe("Area");
    expect(blocks[0].table.children[1].table_row.cells[0][0].text.content).toBe("Payments");
  });

  it("parses a collapsed table with many rows (real-world output)", () => {
    const md = [
      "| Test area | Priority | Details |",
      "|---|---|---|",
      "| Stocktaking — new module | Critical | See Appendix §1 |",
      "| Tap To Pay — production | Critical | See Appendix §2 |",
      "| Italian fiscal compliance | Critical | See Appendix §3 |",
    ].join(" ");  // all collapsed onto one line

    const blocks = markdownToNotionBlocks(md);
    expect(blocks[0].type).toBe("table");
    expect(blocks[0].table.table_width).toBe(3);
    expect(blocks[0].table.children).toHaveLength(4); // header + 3 data rows
    expect(blocks[0].table.children[0].table_row.cells[0][0].text.content).toBe("Test area");
    expect(blocks[0].table.children[1].table_row.cells[0][0].text.content).toBe("Stocktaking — new module");
    expect(blocks[0].table.children[3].table_row.cells[0][0].text.content).toBe("Italian fiscal compliance");
  });

  it("leaves normal multi-line content untouched", () => {
    const md = `# Title\n\nSome paragraph text.\n\n- item 1\n- item 2`;
    const blocks = markdownToNotionBlocks(md);
    expect(blocks[0].type).toBe("heading_1");
    expect(blocks[1].type).toBe("paragraph");
    expect(blocks[2].type).toBe("bulleted_list_item");
    expect(blocks[3].type).toBe("bulleted_list_item");
  });
});

