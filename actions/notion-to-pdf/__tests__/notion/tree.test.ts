import { describe, it, expect } from "vitest";
import { buildBlockTree } from "../../src/notion/tree";

function makeClient(mockMap: Record<string, any[]>) {
  return {
    blocks: {
      children: {
        list: async ({ block_id, start_cursor }: { block_id: string; start_cursor?: string | undefined }) => {
          const items = mockMap[block_id] || [];
          // simple single-page pagination simulation
          return {
            results: items,
            has_more: false,
            next_cursor: null
          };
        }
      }
    }
  } as any;
}

describe("notion/tree buildBlockTree", () => {
  it("recursively builds child nodes when has_children is true", async () => {
    const rootId = "root";
    const mock = makeClient({
      [rootId]: [
        { id: "a", type: "paragraph", paragraph: { rich_text: [] }, has_children: true },
        { id: "b", type: "heading_2", heading_2: { rich_text: [] }, has_children: false }
      ],
      a: [
        { id: "a1", type: "paragraph", paragraph: { rich_text: [] }, has_children: false }
      ]
    });
    const tree = await buildBlockTree(mock, rootId);
    expect(tree.length).toBe(2);
    const a = tree[0];
    expect(a.block.id).toBe("a");
    expect(a.children.length).toBe(1);
    expect(a.children[0].block.id).toBe("a1");
    const b = tree[1];
    expect(b.block.id).toBe("b");
    expect(b.children.length).toBe(0);
  });

  it("treats toggle and child_page as expandable even without has_children", async () => {
    const rootId = "root2";
    const mock = makeClient({
      [rootId]: [
        { id: "t", type: "toggle", toggle: { rich_text: [] }, has_children: false },
        { id: "c", type: "child_page", child_page: { title: "Sub" }, has_children: false }
      ],
      t: [{ id: "t1", type: "paragraph", paragraph: { rich_text: [] }, has_children: false }],
      c: [{ id: "c1", type: "paragraph", paragraph: { rich_text: [] }, has_children: false }]
    });
    const tree = await buildBlockTree(mock, rootId);
    const t = tree.find(n => n.block.id === "t")!;
    const c = tree.find(n => n.block.id === "c")!;
    expect(t.children.length).toBe(1);
    expect(c.children.length).toBe(1);
  });
});


