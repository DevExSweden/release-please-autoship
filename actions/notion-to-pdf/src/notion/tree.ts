import { Client } from "@notionhq/client";
import { BlockNode, BlockObject } from "../types/notion";

export async function listChildren(notion: Client, parentId: string): Promise<BlockObject[]> {
  const results: BlockObject[] = [];
  let cursor: string | undefined = undefined;
  do {
    const resp = await notion.blocks.children.list({
      block_id: parentId,
      page_size: 100,
      start_cursor: cursor
    });
    results.push(...(resp.results as BlockObject[]));
    cursor = resp.has_more ? resp.next_cursor ?? undefined : undefined;
  } while (cursor);
  return results;
}

export async function buildBlockTree(notion: Client, parentId: string): Promise<BlockNode[]> {
  const blocks = await listChildren(notion, parentId);
  const nodes: BlockNode[] = [];
  for (const b of blocks) {
    const needsChildren =
      Boolean(b.has_children) ||
      b.type === "child_page" ||
      b.type === "toggle" ||
      b.type === "table";
    const childNodes = needsChildren ? await buildBlockTree(notion, b.id) : [];
    nodes.push({ block: b, children: childNodes });
  }
  return nodes;
}


